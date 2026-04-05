export interface AdccWorldChampionshipEventReference {
  year: number;
  name: string;
  location?: string;
  resultsUrl?: string;
}

export const ADCC_WORLD_CHAMPIONSHIP_EVENT_REFERENCES: AdccWorldChampionshipEventReference[] =
  [
    { year: 1998, name: 'ADCC Submission Fighting World Championship 1998' },
    { year: 1999, name: 'ADCC Submission Fighting World Championship 1999' },
    { year: 2000, name: 'ADCC Submission Fighting World Championship 2000' },
    { year: 2001, name: 'ADCC Submission Fighting World Championship 2001' },
    { year: 2003, name: 'ADCC Submission Fighting World Championship 2003' },
    { year: 2005, name: 'ADCC Submission Fighting World Championship 2005' },
    { year: 2007, name: 'ADCC Submission Fighting World Championship 2007' },
    { year: 2009, name: 'ADCC Submission Fighting World Championship 2009' },
    { year: 2011, name: 'ADCC Submission Fighting World Championship 2011' },
    { year: 2013, name: 'ADCC Submission Fighting World Championship 2013' },
    { year: 2015, name: 'ADCC Submission Fighting World Championship 2015' },
    { year: 2017, name: 'ADCC Submission Fighting World Championship 2017' },
    { year: 2019, name: 'ADCC Submission Fighting World Championship 2019' },
    { year: 2022, name: 'ADCC Submission Fighting World Championship 2022' },
    {
      year: 2024,
      name: 'ADCC Submission Fighting World Championship 2024',
      location: 'T-Mobile Arena, Las Vegas, Nevada, United States',
      resultsUrl:
        'https://adcombat.com/adcc-events/adcc-submission-fighting-world-championship-2024/',
    },
  ];

export const ADCC_WORLD_CHAMPIONSHIP_YEARS =
  ADCC_WORLD_CHAMPIONSHIP_EVENT_REFERENCES.map((event) => event.year);
