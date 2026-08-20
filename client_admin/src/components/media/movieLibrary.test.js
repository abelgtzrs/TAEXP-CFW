import assert from "node:assert/strict";
import { buildMovieLibrary, movieKey } from "./movieLibrary.js";

const movies = [
  { title: "Arrival", releaseYear: 2016, status: "watched", genre: ["Drama", "Science Fiction"] },
  { title: "Alien", releaseYear: 1979, status: "backlog", genre: ["Horror", "Science Fiction"] },
  { title: "Dune", releaseYear: 2021, status: "completed", genre: ["Science Fiction"] },
];

const scienceFiction = buildMovieLibrary(movies, "Science Fiction");

assert.deepEqual(scienceFiction.genres, ["Drama", "Horror", "Science Fiction"]);
assert.deepEqual(scienceFiction.watchlist.map((movie) => movie.title), ["Alien"]);
assert.deepEqual(scienceFiction.watched.map((movie) => movie.title), ["Arrival", "Dune"]);
assert.equal(movieKey(movies[0]), "arrival::2016");
