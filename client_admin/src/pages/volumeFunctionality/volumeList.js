// Puts a saved volume into a list in place of a refetch. An update that changes the volume
// number creates a new record on the server, so an unknown id is appended rather than replaced.
export const upsertVolume = (volumes, saved) =>
  volumes.some((volume) => volume._id === saved._id)
    ? volumes.map((volume) => (volume._id === saved._id ? saved : volume))
    : [...volumes, saved];
