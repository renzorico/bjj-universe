import {
  AdccEventReconciliationArtifact,
  ReconciledResultRow,
} from '@/data/reconciliation/buildAdccEventReconciliation';
import { RawAdccFixture, RawAdccMatchRecord } from '@/domain/types';

export function promoteOfficialResultsToFixture(
  baseFixture: RawAdccFixture,
  artifacts: AdccEventReconciliationArtifact[],
): RawAdccFixture {
  const promotedMatches = artifacts.flatMap((artifact) =>
    shouldPromoteArtifact(artifact)
      ? buildOfficialResultRelations(artifact)
      : [],
  );

  if (promotedMatches.length === 0) {
    return baseFixture;
  }

  return {
    source: 'adcc-historical-kaggle',
    label: `${baseFixture.label} + promoted official results`,
    notes: `${baseFixture.notes} Promoted official-only ADCC result rows are converted into auditable official_result_relation records when Kaggle has no event rows for that year.`,
    matches: [...baseFixture.matches, ...promotedMatches],
  };
}

function shouldPromoteArtifact(artifact: AdccEventReconciliationArtifact) {
  return (
    artifact.summary.kaggleEventRowsInYear === 0 &&
    artifact.summary.officialRows > 0
  );
}

function buildOfficialResultRelations(
  artifact: AdccEventReconciliationArtifact,
): RawAdccMatchRecord[] {
  const divisions = groupByDivision(artifact.officialOnlyRows);

  return [...divisions.values()].flatMap((rows) => {
    const sortedRows = [...rows].sort((left, right) => {
      if ((left.rank ?? 99) !== (right.rank ?? 99)) {
        return (left.rank ?? 99) - (right.rank ?? 99);
      }

      return left.athleteName.localeCompare(right.athleteName);
    });

    const matches: RawAdccMatchRecord[] = [];

    for (let index = 0; index < sortedRows.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < sortedRows.length; compareIndex += 1) {
        const winner = sortedRows[index];
        const loser = sortedRows[compareIndex];

        matches.push({
          sourceMatchId: `${artifact.event.slug}:${winner.divisionLabel}:${winner.rank}-${loser.rank}`,
          recordType: 'official_result_relation',
          event: {
            name: artifact.event.title ?? artifact.event.slug,
            year: artifact.event.year,
          },
          sex: winner.sex ?? undefined,
          weightClass: winner.weightClass ?? undefined,
          winner: { name: winner.athleteName },
          loser: { name: loser.athleteName },
          method: 'OFFICIAL_RESULT_RELATION',
          round: `PLACE_${winner.rank}_OVER_${loser.rank}`,
        });
      }
    }

    return matches;
  });
}

function groupByDivision(rows: ReconciledResultRow[]) {
  return rows.reduce((registry, row) => {
    const key = `${row.eventYear}:${row.sex ?? 'unknown'}:${row.weightClass ?? 'unknown'}`;
    const existing = registry.get(key) ?? [];
    existing.push(row);
    registry.set(key, existing);
    return registry;
  }, new Map<string, ReconciledResultRow[]>());
}
