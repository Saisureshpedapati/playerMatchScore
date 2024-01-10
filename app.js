const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertToMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// 1 getPlayer
app.get("/players/", async (request, response) => {
  const getPlayers = `
  SELECT 
    * 
  FROM 
    player_details;`;
  const playersArray = await db.all(getPlayers);
  response.send(
    playersArray.map((eachPlayer) => convertToCamelCase(eachPlayer))
  );
});

// 2 getPlayerWithId
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayers = `
  SELECT 
    * 
  FROM 
    player_details
  where
    player_id = ${playerId}`;
  const playersArray = await db.get(getPlayers);
  response.send(convertToCamelCase(playersArray));
});

// 3 putPlayerId
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const putPlayerId = request.body;
  const { playerName } = putPlayerId;
  const putPlayer = `
    UPDATE 
        player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId}`;

  await db.run(putPlayer);
  response.send("Player Details Updated");
});

// 4 getMatchWithId
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
  SELECT 
    * 
  FROM 
    match_details
  where
    match_id = ${matchId}`;
  const matchArray = await db.get(getMatch);
  response.send(convertToMatchDetails(matchArray));
});

// 5 getMatchesWithPlayerId
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetails = `
  SELECT 
    * 
  FROM 
    player_match_score natural join match_details
  where
    player_id = ${playerId}`;
  const matchArray = await db.all(getPlayerMatchDetails);
  response.send(
    matchArray.map((eachMatch) => convertToMatchDetails(eachMatch))
  );
});

// 6 getPlayersWithMatchId
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchDetails = `
  SELECT 
    player_match_score.player_id AS playerId,
    player_name AS playerName
  FROM 
    player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
  where
    match_id = ${matchId}`;
  const playerArray = await db.all(getPlayerMatchDetails);
  response.send(playerArray);
});

// 7 getPlayersScores
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetails = `
  SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    sum(player_match_score.score) AS totalScore,
    sum(fours) AS totalFours,
    sum(sixes) AS totalSixes

  FROM 
    player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
  where
    player_details.player_id = ${playerId}`;
  const playerScore = await db.get(getPlayerMatchDetails);
  response.send(playerScore);
});

module.exports = app;
