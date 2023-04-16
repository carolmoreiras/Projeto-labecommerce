import express from "express";
import cors from "cors"
import { db } from "./database/knex"
import { emailRegex, passwordRegex } from "./constants";

const app = express()

app.use(express.json())
app.use(cors())
app.listen(3003, () => {
  console.log("app ready on localhost:3003")
})

app.get("/users", async (req, res) => {
  try {
    const users = await db("users")
    res.send(users)

  } catch (error) {
    console.log(error)

    if (req.statusCode === 200) {
      res.status(500)
    }

    if (error instanceof Error) {
      res.send(error.message)
    } else {
      res.send("Erro inesperado")
    }
  }
})

app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400)
      throw new Error("Dados inválidos")
    }

    if (!email.match(emailRegex)) {
      res.status(400)
      throw new Error("Email inválido")
    }

    if (!password.match(passwordRegex)) {
      res.status(400)
      throw new Error("'password' deve possuir entre 8 e 12 caracteres, com letras maiúsculas e minúsculas e no mínimo um número e um caracter especial.")
    }

    const [userAlreadyExist] = await db("users").where({ email })

    if (userAlreadyExist) {
      res.status(400)
      throw new Error("Usuário já cadastrado")
    }

    const newUser = await db("users")
      .insert({ name, email, password })
      .returning(["id", "name", "email"])

    res.send(newUser)

  } catch (error) {
    console.log(error)

    if (req.statusCode === 200) {
      res.status(500)
    }

    if (error instanceof Error) {
      res.send(error.message)
    } else {
      res.send("Erro inesperado")
    }
  }
})

app.post("/products", async (req, res) => {
  try {
    const { name, price, description, image_url } = req.body
    if (
      typeof name !== "string" ||
      typeof price !== "number"
    ) {
      res.status(400)
      throw new Error("Dados inválidos")
    }

    const [productAlreadyExist] = await db("products").where({ name })

    if (productAlreadyExist) {
      res.status(400)
      throw new Error("Produto já cadastrado")
    }

    const newProduct = await db("products")
      .insert({ name, price, description, image_url })
      .returning("*")

    res.send(newProduct)

  } catch (error) {
    console.log(error)

    if (req.statusCode === 200) {
      res.status(500)
    }

    if (error instanceof Error) {
      res.send(error.message)
    } else {
      res.send("Erro inesperado")
    }
  }
})

app.get("/products", async (req, res) => {
  try {

    const q = req.query.q as string

    if (!(q?.length > 0)) {
      const products = await db("products")
      res.send(products)
    }

    const products = await db("products").whereLike('name', `%${q}%`)

    if (products.length) {
      res.send(products)
    }

    res.send("Produto não encontado")

  } catch (error) {
    console.log(error)

    if (req.statusCode === 200) {
      res.status(500)
    }

    if (error instanceof Error) {
      res.send(error.message)
    } else {
      res.send("Erro inesperado")
    }
  }
})

app.put("/products/:id", async (req, res) => {
  try {
    const productsId = req.params.id

    const body = req.body
    if (isNaN(parseInt(productsId))) {
      res.status(404)
      throw new Error("id não encontrado")
    }

    const [products] = await db("products").where({ id: productsId })

    if (!products) {
      res.status(404)
      throw new Error("id não encontrado")
    }

    const newProduct = {
      name: body.name ?? products.name,
      price: body.price ?? products.price,
      description: body.description ?? products.description,
      image_url: body.image_url ?? products.image_url
    }

    const updatedProduct = await db("products")
      .update(newProduct)
      .where({ id: productsId })
      .returning("*")

    res.send({ message: "produto atualizado", updatedProduct })

  } catch (error) {
    console.log(error)

    if (req.statusCode === 200) {
      res.status(500)
    }

    if (error instanceof Error) {
      res.send(error.message)
    } else {
      res.send("Erro inesperado")
    }
  }
})

app.post('/purchase', async (req, res) => {
  try {
    const body = req.body

    if (!(body.buyerId > 0 && body.products.length > 0)) {
      res.status(400)
      throw new Error("Dados inválidos")
    }

    const [userIdExists] = await db("users").where({ id: body.buyerId })

    if (!userIdExists) {
      res.status(400)
      throw new Error("Dados inválidos")
    }

    const purchaseProductsIds = body.products.reduce(
      (products: any[], product: { productId: any; }) => {
        products.push(product.productId)

        return products
      },
      []
    )

    const productsFromDB = await db("products")
      .whereIn('id', purchaseProductsIds)

    if (purchaseProductsIds.length !== productsFromDB.length) {
      res.status(400)
      throw new Error("Dados inválidos")
    }

    let totalPrice = 0

    for (let i = 0; i < productsFromDB.length; i++) {
      const productDB = productsFromDB[i]
      const purchaseProduct = body.products[i]

      totalPrice += productDB.price * purchaseProduct.quantity
    }

    const purchase = {
      buyer_id: body.buyerId,
      total_price: totalPrice,
    }

    const [createdPurchase] = await db("purchases")
      .insert(purchase)
      .returning("*")

    const purchaseProducts = body.products.map((product: { productId: any; quantity: any; }) => {
      return {
        purchase_id: createdPurchase.id,
        product_id: product.productId,
        quantity: product.quantity
      }
    })

    const insertedProducts = []

    for (let i = 0; i < purchaseProducts.length; i++) {
      const purchaseProduct = purchaseProducts[i]

      const [insertedProduct] = await db("purchases_products")
        .insert(purchaseProduct)
        .returning('*')

      insertedProducts.push(insertedProduct)
    }

    const data = {
      ...createdPurchase,
      products: [
        ...insertedProducts
      ]
    }

    res.send({ message: 'compra efetuada', data })
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500)
    }

    if (error instanceof Error) {
      res.send(error.message)
    } else {
      res.send("Erro inesperado")
    }
  }
})

app.delete("/purchase/:purchaseId", async (req, res) => {
  try {
    const purchaseId = req.params.purchaseId

    if (isNaN(parseInt(purchaseId))) {
      res.status(404)
      throw new Error("não encontrado");
    }

    const [purchase] = await db("purchases").where({ id: purchaseId })

    if (!purchase) {
      res.status(404)
      throw new Error("não encontrado");
    }

    await db("purchases_products").del().where({ purchase_id: purchaseId })

    await db("purchases").del().where({ id: purchaseId })

    res.sendStatus(200)
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500)
    }

    if (error instanceof Error) {
      res.send(error.message)
    } else {
      res.send("Erro inesperado")
    }
  }
})

app.get('/purchase/:purchaseId', async(req, res) => {
  try {
    const purchaseId = req.params.purchaseId
    
    if (isNaN(parseInt(purchaseId))) {
      res.status(404)
      throw new Error("não encontrado");
    }
    
    const [purchase] = await db("purchases").where({id: purchaseId})

    if (!purchase) {
      res.status(404)
      throw new Error("não encontrado");
    }

    const purchaseProducts = await db
      .select(
        "purchases_products.product_id",
        "purchases_products.quantity",
        "products.name",
        "products.price",
      )
      .from("purchases_products")
      .where({purchase_id: purchaseId})
      .innerJoin(
        "products",
        "purchases_products.product_id",
        '=',
        "products.id"
      )

    const data = {
      ...purchase,
      products: purchaseProducts
    }

    res.send(data)
    
  } catch (error) {
    console.log(error);

    if (req.statusCode === 200) {
      res.status(500)
    }

    if (error instanceof Error) {
      res.send(error.message)
    } else {
      res.send("Erro inesperado")
    }
  }
})