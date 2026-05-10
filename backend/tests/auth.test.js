const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

describe("Auth routes", () => {
  const test_user = {
    first_name: "john",
    last_name: "doe",
    username: "toch_man",
    email: " okeakputochukwu9@gmail.com",
    password: "Tokizzy123$",
    role: "Buyer",
    phone: "09098979284",
  };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  }, 15000);

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (let key in collections) {
      await collections[key].deleteMany();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  }, 15000);

  describe("POST /auth/sign_up", () => {
    test("should register a new user", async () => {
      const res = await request(app).post("/auth/signup").send(test_user);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("user");
    });

    test("should not register with existing email", async () => {
      const res = await request(app).post("/auth/signup").send(test_user);

      expect(res.statusCode).toBe(409);
    });
  });
});
