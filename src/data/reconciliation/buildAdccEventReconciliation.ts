import {
  ScrapedAdccOfficialResultsPage,
} from '@/data/scraping/parseAdccOfficialResultsPage';
import { ADCC_SOURCE_PRECEDENCE_RULES } from '@/data/reconciliation/sourcePrecedence';
import { RawAdccFixture } from '@/domain/types';
import { slugify } from '@/lib/slugify';

type ReconciliationStatus =
  | 'exact_match'
  | 'likely_match'
  | 'mismatch'
  | 'official_only'
  | 'kaggle_only';

type KagglePlacementConfidence = 'exact' | 'likely' | 'presence_only';

export interface ReconciliationManifestEntry {
  slug: string;
  eventYear: number;
  eventType: 'worlds';
  officialParsedPath: string;
}

export interface ReconciledResultRow {
  rowId: string;
  eventYear: number;
  sex: string | null;
  weightClass: string | null;
  athleteName: string;
  athleteKey: string;
  rank: number | null;
  source: 'official' | 'kaggle';
  divisionLabel: string;
  confidence?: KagglePlacementConfidence;
  notes: string[];
}

export interface ReconciliationPair {
  officialRow: ReconciledResultRow;
  kaggleRow: ReconciledResultRow;
  reason: string;
}

export interface ManualReviewItem {
  status: Exclude<ReconciliationStatus, 'exact_match'>;
  officialRow?: ReconciledResultRow;
  kaggleRow?: ReconciledResultRow;
  notes: string[];
}

export interface AdccEventReconciliationArtifact {
  generatedAt: string;
  event: {
    slug: string;
    year: number;
    eventType: string;
    title: string | null;
    sourceUrl: string;
  };
  sourcePrecedence: typeof ADCC_SOURCE_PRECEDENCE_RULES;
  summary: {
    officialRows: number;
    kaggleRows: number;
    exactMatches: number;
    likelyMatches: number;
    mismatches: number;
    officialOnly: number;
    kaggleOnly: number;
    manualReviewCount: number;
    kaggleEventRowsInYear: number;
  };
  exactMatches: ReconciliationPair[];
  likelyMatches: ReconciliationPair[];
  mismatches: ReconciliationPair[];
  officialOnlyRows: ReconciledResultRow[];
  kaggleOnlyRows: ReconciledResultRow[];
  manualReview: ManualReviewItem[];
}

export function buildAdccEventReconciliation(
  manifestEntry: ReconciliationManifestEntry,
  officialEvent: ScrapedAdccOfficialResultsPage,
  historicalSource: RawAdccFixture,
): AdccEventReconciliationArtifact {
  const officialRows = buildOfficialRows(manifestEntry, officialEvent);
  const kaggleEvidence = buildKaggleRows(manifestEntry.eventYear, historicalSource);
  const kaggleRows = [...kaggleEvidence.placementRows];
  const unmatchedKaggleRows = [...kaggleRows];
  const exactMatches: ReconciliationPair[] = [];
  const likelyMatches: ReconciliationPair[] = [];
  const mismatches: ReconciliationPair[] = [];
  const officialOnlyRows: ReconciledResultRow[] = [];
  const manualReview: ManualReviewItem[] = [];

  for (const officialRow of officialRows) {
    const exactCandidate = findCandidate(
      unmatchedKaggleRows,
      kaggleEvidence.presenceRows,
      officialRow,
      'exact',
    );

    if (exactCandidate) {
      removeRow(unmatchedKaggleRows, exactCandidate.kaggleRow.rowId);

      if (exactCandidate.status === 'exact_match') {
        exactMatches.push({
          officialRow,
          kaggleRow: exactCandidate.kaggleRow,
          reason: exactCandidate.reason,
        });
      } else {
        mismatches.push({
          officialRow,
          kaggleRow: exactCandidate.kaggleRow,
          reason: exactCandidate.reason,
        });
        manualReview.push({
          status: 'mismatch',
          officialRow,
          kaggleRow: exactCandidate.kaggleRow,
          notes: [exactCandidate.reason],
        });
      }
      continue;
    }

    const likelyCandidate = findCandidate(
      unmatchedKaggleRows,
      kaggleEvidence.presenceRows,
      officialRow,
      'likely',
    );

    if (likelyCandidate) {
      removeRow(unmatchedKaggleRows, likelyCandidate.kaggleRow.rowId);
      likelyMatches.push({
        officialRow,
        kaggleRow: likelyCandidate.kaggleRow,
        reason: likelyCandidate.reason,
      });
      manualReview.push({
        status: 'likely_match',
        officialRow,
        kaggleRow: likelyCandidate.kaggleRow,
        notes: [likelyCandidate.reason],
      });
      continue;
    }

    officialOnlyRows.push(officialRow);
    manualReview.push({
      status: 'official_only',
      officialRow,
      notes: [
        officialRow.eventYear === manifestEntry.eventYear && kaggleRows.length === 0
          ? 'No Kaggle rows exist for this event year/division.'
          : 'No Kaggle candidate aligned to this official result row.',
      ],
    });
  }

  const kaggleOnlyRows = unmatchedKaggleRows;
  kaggleOnlyRows.forEach((kaggleRow) => {
    manualReview.push({
      status: 'kaggle_only',
      kaggleRow,
      notes: ['Kaggle inferred a placement with no official row alignment.'],
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    event: {
      slug: manifestEntry.slug,
      year: manifestEntry.eventYear,
      eventType: manifestEntry.eventType,
      title: officialEvent.eventTitle,
      sourceUrl: officialEvent.sourceUrl,
    },
    sourcePrecedence: ADCC_SOURCE_PRECEDENCE_RULES,
    summary: {
      officialRows: officialRows.length,
      kaggleRows: kaggleRows.length,
      exactMatches: exactMatches.length,
      likelyMatches: likelyMatches.length,
      mismatches: mismatches.length,
      officialOnly: officialOnlyRows.length,
      kaggleOnly: kaggleOnlyRows.length,
      manualReviewCount: manualReview.length,
      kaggleEventRowsInYear: historicalSource.matches.filter(
        (match) => match.event.year === manifestEntry.eventYear,
      ).length,
    },
    exactMatches,
    likelyMatches,
    mismatches,
    officialOnlyRows,
    kaggleOnlyRows,
    manualReview,
  };
}

export function renderAdccEventReconciliationMarkdown(
  artifact: AdccEventReconciliationArtifact,
): string {
  const lines = [
    '# ADCC Event Reconciliation',
    '',
    `Generated: ${artifact.generatedAt}`,
    `Event: ${artifact.event.title ?? artifact.event.slug}`,
    `Source URL: ${artifact.event.sourceUrl}`,
    '',
    '## Summary',
    '',
    `- Official rows: ${artifact.summary.officialRows}`,
    `- Kaggle rows: ${artifact.summary.kaggleRows}`,
    `- Exact matches: ${artifact.summary.exactMatches}`,
    `- Likely matches: ${artifact.summary.likelyMatches}`,
    `- Mismatches: ${artifact.summary.mismatches}`,
    `- Official-only rows: ${artifact.summary.officialOnly}`,
    `- Kaggle-only rows: ${artifact.summary.kaggleOnly}`,
    `- Manual review items: ${artifact.summary.manualReviewCount}`,
    `- Kaggle raw rows in event year: ${artifact.summary.kaggleEventRowsInYear}`,
    '',
    '## Source Precedence',
    '',
    ...artifact.sourcePrecedence.map(
      (rule) => `- ${rule.rank}. ${rule.role}: ${rule.usage}`,
    ),
    '',
    '## Findings',
    '',
  ];

  if (
    artifact.summary.exactMatches === 0 &&
    artifact.summary.likelyMatches === 0 &&
    artifact.summary.mismatches === 0 &&
    artifact.summary.kaggleRows === 0
  ) {
    lines.push(
      '- No Kaggle result rows aligned to this official event. The official page currently stands alone and should be imported as authoritative event truth.',
    );
  }

  if (artifact.officialOnlyRows.length > 0) {
    lines.push('', '### Official Only', '');
    artifact.officialOnlyRows.slice(0, 30).forEach((row) => {
      lines.push(
        `- ${row.divisionLabel} · #${row.rank} · ${row.athleteName}`,
      );
    });
  }

  if (artifact.likelyMatches.length > 0) {
    lines.push('', '### Likely Matches', '');
    artifact.likelyMatches.slice(0, 20).forEach((pair) => {
      lines.push(
        `- ${pair.officialRow.athleteName} (${pair.officialRow.divisionLabel}) ↔ ${pair.kaggleRow.athleteName}: ${pair.reason}`,
      );
    });
  }

  if (artifact.mismatches.length > 0) {
    lines.push('', '### Mismatches', '');
    artifact.mismatches.slice(0, 20).forEach((pair) => {
      lines.push(
        `- ${pair.officialRow.athleteName} official #${pair.officialRow.rank} vs Kaggle #${pair.kaggleRow.rank}: ${pair.reason}`,
      );
    });
  }

  if (artifact.kaggleOnlyRows.length > 0) {
    lines.push('', '### Kaggle Only', '');
    artifact.kaggleOnlyRows.slice(0, 20).forEach((row) => {
      lines.push(
        `- ${row.divisionLabel} · #${row.rank ?? '?'} · ${row.athleteName} (${row.confidence ?? 'unknown'})`,
      );
    });
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function buildOfficialRows(
  manifestEntry: ReconciliationManifestEntry,
  officialEvent: ScrapedAdccOfficialResultsPage,
): ReconciledResultRow[] {
  return officialEvent.divisions.flatMap((division) =>
    division.placements.map((placement) => {
      const weightClass = normalizeWeightClass(division.weightClass);
      const athleteKey = normalizeAthleteName(placement.athleteName);
      const rowId = `${manifestEntry.slug}:official:${division.divisionLabel}:${placement.rank}:${athleteKey}`;

      return {
        rowId,
        eventYear: manifestEntry.eventYear,
        sex: division.sex,
        weightClass,
        athleteName: placement.athleteName,
        athleteKey,
        rank: placement.rank,
        source: 'official',
        divisionLabel: formatDivisionLabel(division.sex, weightClass),
        notes: [],
      };
    }),
  );
}

function buildKaggleRows(
  eventYear: number,
  historicalSource: RawAdccFixture,
): {
  placementRows: ReconciledResultRow[];
  presenceRows: ReconciledResultRow[];
} {
  const grouped = new Map<string, ReturnType<typeof createKaggleCandidate>>();

  historicalSource.matches
    .filter((match) => match.event.year === eventYear)
    .forEach((match) => {
      const sex = match.sex ?? null;
      const weightClass = normalizeWeightClass(match.weightClass ?? null);
      const divisionLabel = formatDivisionLabel(sex, weightClass);
      const winnerKey = normalizeAthleteName(match.winner.name);
      const loserKey = normalizeAthleteName(match.loser.name);

      const winnerCandidate = getOrCreateKaggleCandidate(
        grouped,
        eventYear,
        sex,
        weightClass,
        match.winner.name,
        winnerKey,
        divisionLabel,
      );
      const loserCandidate = getOrCreateKaggleCandidate(
        grouped,
        eventYear,
        sex,
        weightClass,
        match.loser.name,
        loserKey,
        divisionLabel,
      );

      winnerCandidate.wins += 1;
      loserCandidate.losses += 1;

      const round = (match.round ?? '').toUpperCase();

      if (round) {
        winnerCandidate.winningRounds.add(round);
        loserCandidate.losingRounds.add(round);
      }
    });

  const placementRows: ReconciledResultRow[] = [];
  const presenceRows: ReconciledResultRow[] = [];

  [...grouped.values()].forEach((candidate) => {
    const inferred = inferKagglePlacement(candidate);

    if (!inferred) {
      return;
    }

    if (inferred.confidence === 'presence_only') {
      presenceRows.push(inferred);
      return;
    }

    placementRows.push(inferred);
  });

  const sorter = (left: ReconciledResultRow, right: ReconciledResultRow) => {
    if (left.divisionLabel !== right.divisionLabel) {
      return left.divisionLabel.localeCompare(right.divisionLabel);
    }

    if ((left.rank ?? 99) !== (right.rank ?? 99)) {
      return (left.rank ?? 99) - (right.rank ?? 99);
    }

    return left.athleteName.localeCompare(right.athleteName);
  };

  return {
    placementRows: placementRows.sort(sorter),
    presenceRows: presenceRows.sort(sorter),
  };
}

function createKaggleCandidate(
  eventYear: number,
  sex: string | null,
  weightClass: string | null,
  athleteName: string,
  athleteKey: string,
  divisionLabel: string,
) {
  return {
    rowId: `kaggle:${eventYear}:${sex ?? 'unknown'}:${weightClass ?? 'unknown'}:${athleteKey}`,
    eventYear,
    sex,
    weightClass,
    athleteName,
    athleteKey,
    divisionLabel,
    wins: 0,
    losses: 0,
    winningRounds: new Set<string>(),
    losingRounds: new Set<string>(),
  };
}

function getOrCreateKaggleCandidate(
  grouped: Map<string, ReturnType<typeof createKaggleCandidate>>,
  eventYear: number,
  sex: string | null,
  weightClass: string | null,
  athleteName: string,
  athleteKey: string,
  divisionLabel: string,
) {
  const key = `${eventYear}:${sex ?? 'unknown'}:${weightClass ?? 'unknown'}:${athleteKey}`;
  const existing = grouped.get(key);

  if (existing) {
    return existing;
  }

  const created = createKaggleCandidate(
    eventYear,
    sex,
    weightClass,
    athleteName,
    athleteKey,
    divisionLabel,
  );
  grouped.set(key, created);
  return created;
}

function inferKagglePlacement(
  candidate: ReturnType<typeof createKaggleCandidate>,
): ReconciledResultRow | null {
  const notes: string[] = [];
  let rank: number | null = null;
  let confidence: KagglePlacementConfidence = 'presence_only';

  if (candidate.winningRounds.has('F')) {
    rank = 1;
    confidence = 'exact';
    notes.push('Kaggle winner in final round.');
  } else if (candidate.losingRounds.has('F')) {
    rank = 2;
    confidence = 'exact';
    notes.push('Kaggle loser in final round.');
  } else if (
    candidate.winningRounds.has('3RD') ||
    candidate.winningRounds.has('3PLC')
  ) {
    rank = 3;
    confidence = 'exact';
    notes.push('Kaggle winner in bronze-place round.');
  } else if (
    candidate.losingRounds.has('SF') ||
    candidate.losingRounds.has('SPF')
  ) {
    rank = 3;
    confidence = 'likely';
    notes.push('Kaggle semifinal loss suggests bronze-place finish candidate.');
  } else if (candidate.wins > 0 || candidate.losses > 0) {
    confidence = 'presence_only';
    notes.push('Athlete is present in Kaggle rows for this division, but finish is not inferred confidently.');
  } else {
    return null;
  }

  return {
    rowId: candidate.rowId,
    eventYear: candidate.eventYear,
    sex: candidate.sex,
    weightClass: candidate.weightClass,
    athleteName: candidate.athleteName,
    athleteKey: candidate.athleteKey,
    rank,
    source: 'kaggle',
    divisionLabel: candidate.divisionLabel,
    confidence,
    notes,
  };
}

function findCandidate(
  kaggleRows: ReconciledResultRow[],
  presenceRows: ReconciledResultRow[],
  officialRow: ReconciledResultRow,
  mode: 'exact' | 'likely',
) {
  const sameDivision = kaggleRows.filter(
    (candidate) =>
      candidate.eventYear === officialRow.eventYear &&
      candidate.sex === officialRow.sex &&
      candidate.weightClass === officialRow.weightClass,
  );

  for (const candidate of sameDivision) {
    const exactName = candidate.athleteKey === officialRow.athleteKey;
    const likelyName = isLikelyAthleteMatch(
      candidate.athleteName,
      officialRow.athleteName,
    );

    if (mode === 'exact') {
      if (!exactName || candidate.rank === null) {
        continue;
      }

      if (candidate.rank === officialRow.rank) {
        return {
          status: 'exact_match' as const,
          kaggleRow: candidate,
          reason: 'Same athlete, division, and inferred placement rank.',
        };
      }

      return {
        status: 'mismatch' as const,
        kaggleRow: candidate,
        reason: 'Same athlete and division, but inferred Kaggle rank differs from the official placement.',
      };
    }

    if (!likelyName) {
      continue;
    }

    if (candidate.rank === null || candidate.confidence === 'presence_only') {
      return {
        status: 'likely_match' as const,
        kaggleRow: candidate,
        reason: 'Same division and athlete name pattern, but Kaggle only confirms presence rather than exact placement.',
      };
    }

    if (candidate.rank === officialRow.rank) {
      return {
        status: 'likely_match' as const,
        kaggleRow: candidate,
        reason: 'Athlete name alignment is likely rather than exact, but placement rank agrees.',
      };
    }
  }

  if (mode === 'likely') {
    const presenceCandidate = presenceRows.find(
      (candidate) =>
        candidate.eventYear === officialRow.eventYear &&
        candidate.sex === officialRow.sex &&
        candidate.weightClass === officialRow.weightClass &&
        isLikelyAthleteMatch(candidate.athleteName, officialRow.athleteName),
    );

    if (presenceCandidate) {
      return {
        status: 'likely_match' as const,
        kaggleRow: presenceCandidate,
        reason: 'Same division and athlete name pattern, but Kaggle only confirms athlete presence in the event.',
      };
    }
  }

  return null;
}

function isLikelyAthleteMatch(leftName: string, rightName: string) {
  const left = splitName(leftName);
  const right = splitName(rightName);

  if (!left || !right) {
    return false;
  }

  return (
    left.surname === right.surname &&
    left.firstInitial === right.firstInitial
  );
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  return {
    firstInitial: parts[0][0]?.toLowerCase() ?? '',
    surname: parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, ''),
  };
}

function normalizeAthleteName(name: string) {
  return slugify(name);
}

function normalizeWeightClass(weightClass: string | null) {
  if (!weightClass) {
    return null;
  }

  if (weightClass === 'ABS') {
    return 'ABS';
  }

  if (weightClass.startsWith('-')) {
    return weightClass.slice(1);
  }

  return weightClass;
}

function formatDivisionLabel(sex: string | null, weightClass: string | null) {
  const sexLabel =
    sex === 'M' ? 'M' : sex === 'F' ? 'F' : 'U';
  return `${sexLabel}:${weightClass ?? 'unknown'}`;
}

function removeRow(rows: ReconciledResultRow[], rowId: string) {
  const index = rows.findIndex((row) => row.rowId === rowId);

  if (index >= 0) {
    rows.splice(index, 1);
  }
}
