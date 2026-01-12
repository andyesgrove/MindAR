export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // SCRAPE MODE: Scrape and return fixture data
    if (url.searchParams.get('scrape') === 'true') {
      try {
        const fixturesResponse = await fetch(
          'https://www.footballwebpages.co.uk/afc-whyteleafe',
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
        
        if (!fixturesResponse.ok) {
          throw new Error(`HTTP ${fixturesResponse.status}`);
        }
        
        const html = await fixturesResponse.text();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let nextFixture = null;
        
        // DEBUG: Add parameter to see what we're finding
        const debug = url.searchParams.get('debug') === 'true';
        
        // Pattern: Look for date headers like "Tuesday 13th January 2026"
        const dateHeaderPattern = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d+)(?:st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi;
        const dateMatches = [...html.matchAll(dateHeaderPattern)];
        
        if (debug) {
          return new Response(JSON.stringify({
            debug: true,
            todayDate: today.toISOString().split('T')[0],
            datesFound: dateMatches.length,
            dates: dateMatches.map(m => m[0]),
            htmlLength: html.length,
            htmlSample: html.substring(0, 3000)
          }, null, 2), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        if (dateMatches.length > 0) {
          const monthMap = {
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
          };
          
          for (const dateMatch of dateMatches) {
            const day = dateMatch[1].padStart(2, '0');
            const month = monthMap[dateMatch[2].toLowerCase()];
            const year = dateMatch[3];
            const isoDate = `${year}-${month}-${day}`;
            const fixtureDate = new Date(year, parseInt(month) - 1, parseInt(day));
            
            // Only look at future dates
            if (fixtureDate >= today) {
              // Get a chunk of HTML around this date
              const matchIndex = dateMatch.index;
              const htmlChunk = html.substring(matchIndex, matchIndex + 1500);
              
              // Look for competition name
              const competitionPattern = /([\w\s]+(?:Cup|League|Trophy|Shield|Vase|Bowl)(?:\s+[\w\s]+)?)/i;
              const competitionMatch = htmlChunk.match(competitionPattern);
              const competition = competitionMatch ? competitionMatch[1].trim() : 'Combined Counties League';
              
              // Look for team names
              const awayPattern = /([\w\s&'-]+)\s*AFC Whyteleafe/i;
              const homePattern = /AFC Whyteleafe\s*([\w\s&'-]+)/i;
              
              let homeTeam = 'AFC Whyteleafe';
              let awayTeam = 'TBD';
              let venue = 'Church Road';
              
              const awayMatch = htmlChunk.match(awayPattern);
              const homeMatch = htmlChunk.match(homePattern);
              
              if (awayMatch) {
                homeTeam = awayMatch[1].trim();
                awayTeam = 'AFC Whyteleafe';
                venue = 'Away';
              } else if (homeMatch) {
                awayTeam = homeMatch[1].trim();
              }
              
              // Clean up team names
              homeTeam = homeTeam.replace(/\s+/g, ' ').trim();
              awayTeam = awayTeam.replace(/\s+/g, ' ').trim();
              
              nextFixture = {
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                date: isoDate,
                competition: competition,
                venue: venue
              };
              break;
            }
          }
        }
        
        // Fallback if nothing found
        if (!nextFixture) {
          nextFixture = {
            homeTeam: 'AFC Whyteleafe',
            awayTeam: 'Next opponent TBD',
            date: '2026-01-18',
            competition: 'Combined Counties League',
            venue: 'Church Road'
          };
        }
        
        const scrapedData = {
          success: true,
          scraped: true,
          fixture: nextFixture,
          lastUpdated: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(scrapedData, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // NORMAL MODE: Read from GitHub JSON file
    try {
      const cacheBuster = Date.now();
      const jsonResponse = await fetch(
        `https://raw.githubusercontent.com/andyesgrove/MindAR/main/fixtures.json?cb=${cacheBuster}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
      
      const fixtureData = await jsonResponse.json();
      
      return new Response(JSON.stringify({
        success: true,
        fixture: fixtureData.nextFixture
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
    } catch (error) {
      const mockData = {
        success: true,
        fixture: {
          homeTeam: 'AFC Whyteleafe',
          awayTeam: 'Tadley Calleva',
          date: '2026-01-18',
          competition: 'Combined Counties League',
          venue: 'Church Road'
        }
      };
      
      return new Response(JSON.stringify(mockData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};