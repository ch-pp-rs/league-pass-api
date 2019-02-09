const request = require('request-promise');
const $ = require('cheerio');
const scoresUrl = 'https://www.basketball-reference.com/boxscores/';
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const client = new MongoClient(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SRC}/${process.env.DB_NAME}`);

client.connect().then(function (err) {
    console.log("Connected successfully to server");
    const db = client.db(process.env.DB_NAME);

    request(scoresUrl).then(html => {
        const gamesHTML = $('.game_summaries .game_summary', html);
        const gameDate = $('#content > div.prevnext > span', html).text();
        const games = [];

        for (let i = 0; i < gamesHTML.length; i += 1) {
            const game = {
                date: new Date(gameDate)
            };
            const teams = $('.teams tr td', gamesHTML[i]);
            game.awayTeam = {
                name: $(teams[0]).text(),
                score: $(teams[1]).text(),
                quaterScore: []
            };
            game.homeTeam = {
                name: $(teams[3]).text(),
                score: $(teams[4]).text(),
                quaterScore: []
            };

            const qtrScores = $('table:nth-child(2) td', gamesHTML[i]);

            for (let q = 0; q < qtrScores.length; q += 1) {
                const qtr = $(qtrScores[q]).text();

                if (parseInt(qtr) > 0) {
                    if (q < qtrScores.length / 2) {
                        game.awayTeam.quaterScore.push(qtr);
                    } else {
                        game.homeTeam.quaterScore.push(qtr);
                    }
                }
            }

            games.push(game);
        }

        db.collection('games').insertMany(games)
            .then(res => console.log('success: ', res.insertedCount))
            .catch(err => console.error('err: ', err));

        client.close();
    });
});
