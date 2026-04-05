import { parseBjjHeroesAthleteProfile } from '@/data/enrichment/parseBjjHeroesAthleteProfile';

describe('parseBjjHeroesAthleteProfile', () => {
  it('extracts academy and nationality with provenance', () => {
    const html = `
      <html>
        <body>
          <h1>Gordon Ryan</h1>
          <p>Gordon Ryan is a New Jersey (USA) born grappler.</p>
          <p>Team/Association: New Wave Jiu Jitsu</p>
        </body>
      </html>
    `;

    const parsed = parseBjjHeroesAthleteProfile(html, {
      athleteId: 'athlete_6550',
      athleteName: 'Gordon Ryan',
      sourceName: 'bjjheroes',
      sourceUrl: 'https://www.bjjheroes.com/bjj-fighters/gordon-ryan',
    });

    expect(parsed.status).toBe('enriched');
    expect(parsed.nationality?.value).toBe('United States');
    expect(parsed.academy?.value).toBe('New Wave Jiu Jitsu');
    expect(parsed.nationality?.provenance.sourceName).toBe('bjjheroes');
  });
});
