import { jest } from "@jest/globals";

// Déclare le mock AVANT d'importer le contrôleur
jest.unstable_mockModule("../src/prismaClient.js", () => ({
  default: {
    product: {
      create: jest.fn()
    }
  }
}));

// Ensuite, importe les modules mockés
const prisma = (await import("../src/prismaClient.js")).default;
const { createProduct } = await import("../src/controllers/product.controller.js");

describe("createProduct controller", () => {
  it("crée un produit avec succès", async () => {
    const fakeProduct = { id: 1, name: "Canyon du turfu", priceIndividual: 45 };
    prisma.product.create.mockResolvedValue(fakeProduct);

    const req = {
      body: {
        name: "Canyon du turfu",
        priceIndividual: 45,
        duration: 120,
        level: "decouverte",
        maxCapacity: 10,
        activityTypeId: 1
      },
      user: { role: "guide", userId: 123 }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await createProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      product: fakeProduct
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("appelle next avec une erreur si données manquantes", async () => {
    const req = { body: { name: "" }, user: { role: "guide", userId: 123 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await createProduct(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});