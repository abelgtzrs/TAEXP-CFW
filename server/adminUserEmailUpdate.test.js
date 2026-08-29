const assert = require("node:assert/strict");
const User = require("./models/User");
const { updateUserAdmin } = require("./controllers/userController");

const makeResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.payload = payload;
    return this;
  },
});

const originalExists = User.exists;
const originalFindByIdAndUpdate = User.findByIdAndUpdate;

const run = async () => {
  try {
    assert.equal(User.schema.path("email").options.unique, true);

    let savedUpdates;
    User.exists = async () => null;
    User.findByIdAndUpdate = (_id, updates) => ({
      select: async () => {
        savedUpdates = updates;
        return { _id, ...updates };
      },
    });

    const success = makeResponse();
    await updateUserAdmin({ params: { id: "user-1" }, body: { email: " New.Email@Example.COM " } }, success);
    assert.equal(success.statusCode, 200);
    assert.equal(savedUpdates.email, "new.email@example.com");

    User.exists = async () => ({ _id: "user-2" });
    const duplicate = makeResponse();
    await updateUserAdmin({ params: { id: "user-1" }, body: { email: "used@example.com" } }, duplicate);
    assert.equal(duplicate.statusCode, 409);

    const invalid = makeResponse();
    await updateUserAdmin({ params: { id: "user-1" }, body: { email: "not-an-email" } }, invalid);
    assert.equal(invalid.statusCode, 400);

    console.log("Admin user email update checks passed.");
  } finally {
    User.exists = originalExists;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
