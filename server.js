// =============================================
//  SERVER.JS - SDK NUEVO DE MERCADO PAGO (v2+)
//  ¡Sin axios! Usando @mercadopago/sdk-node
// =============================================

const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const path = require("path");
const cors = require("cors");

const app = express();

// ── Middlewares ──────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // tu index.html va en /public

// ── Configuración MercadoPago ────────────────
// Reemplazá este valor por tu Access Token real
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "TU_ACCESS_TOKEN_AQUI",
  options: { timeout: 5000 },
});

// ── Ruta principal ───────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Crear preferencia de pago ────────────────
app.post("/crear-preferencia", async (req, res) => {
  try {
    const { titulo, precio, cantidad } = req.body;

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: titulo || "Producto",
            unit_price: Number(precio) || 100,
            quantity: Number(cantidad) || 1,
            currency_id: "ARS", // Cambiá a "USD", "COP", etc. según tu país
          },
        ],
        back_urls: {
          success: `${process.env.BASE_URL || "http://localhost:3000"}/pago-exitoso`,
          failure: `${process.env.BASE_URL || "http://localhost:3000"}/pago-fallido`,
          pending: `${process.env.BASE_URL || "http://localhost:3000"}/pago-pendiente`,
        },
        auto_return: "approved",
        // Podés agregar más campos: payer, shipments, payment_methods, etc.
      },
    });

    res.json({
      ok: true,
      id: response.id,
      init_point: response.init_point,          // URL de pago producción
      sandbox_init_point: response.sandbox_init_point, // URL de pago sandbox/pruebas
    });
  } catch (error) {
    console.error("❌ Error al crear preferencia:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Páginas de resultado ─────────────────────
app.get("/pago-exitoso", (req, res) => {
  res.send("<h1>✅ ¡Pago exitoso! Gracias por tu compra.</h1>");
});

app.get("/pago-fallido", (req, res) => {
  res.send("<h1>❌ El pago falló. Intentá de nuevo.</h1>");
});

app.get("/pago-pendiente", (req, res) => {
  res.send("<h1>⏳ Pago pendiente. Te avisaremos cuando se confirme.</h1>");
});

// ── Webhook de MercadoPago (opcional pero recomendado) ──
app.post("/webhook", (req, res) => {
  const { type, data } = req.body;
  console.log("📩 Webhook recibido:", type, data);
  // Aquí podés validar el pago y actualizar tu base de datos
  res.sendStatus(200);
});

// ── Iniciar servidor ─────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
