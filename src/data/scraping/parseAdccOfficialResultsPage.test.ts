import { parseAdccOfficialResultsPage } from '@/data/scraping/parseAdccOfficialResultsPage';

describe('parseAdccOfficialResultsPage', () => {
  it('extracts event metadata and placements from an official results page', () => {
    const html = `
      <html>
        <body>
          <h1>ADCC Submission Fighting World Championship 2024</h1>
          <div>Aug</div>
          <div>17</div>
          <div>2024</div>
          <p>Organized By: ADCC Federation</p>
          <p>T-Mobile Arena, Las Vegas, Nevada, United States</p>
          <h2>OFFICIAL RESULTS</h2>
          <div>MALE -66KG</div>
          <div>1. Diogo Reis</div>
          <div>2. Diego Pato</div>
          <div>3. Josh Cisneros</div>
          <div>FEMALE ABSOLUTE</div>
          <div>1. Adele Fornarino</div>
          <div>2. Bia Mesquita</div>
          <h2>BRACKETS</h2>
        </body>
      </html>
    `;

    const parsed = parseAdccOfficialResultsPage(
      html,
      'https://adcombat.com/adcc-events/adcc-submission-fighting-world-championship-2024/',
    );

    expect(parsed.eventTitle).toBe(
      'ADCC Submission Fighting World Championship 2024',
    );
    expect(parsed.eventDate).toBe('Aug 17, 2024');
    expect(parsed.organizer).toBe('ADCC Federation');
    expect(parsed.location).toContain('T-Mobile Arena');
    expect(parsed.divisions).toEqual([
      {
        divisionLabel: 'MALE -66KG',
        sex: 'M',
        weightClass: '-66KG',
        placements: [
          { rank: 1, athleteName: 'Diogo Reis' },
          { rank: 2, athleteName: 'Diego Pato' },
          { rank: 3, athleteName: 'Josh Cisneros' },
        ],
      },
      {
        divisionLabel: 'FEMALE ABSOLUTE',
        sex: 'F',
        weightClass: 'ABS',
        placements: [
          { rank: 1, athleteName: 'Adele Fornarino' },
          { rank: 2, athleteName: 'Bia Mesquita' },
        ],
      },
    ]);
  });
});
