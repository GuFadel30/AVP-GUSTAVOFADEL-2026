import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body ?? {};
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedName || !normalizedEmail || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Nome, email e senha são obrigatórios"
      });
    }

    const usuarioExiste = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (usuarioExiste) {
      return res.status(400).json({
        message: "E-mail já cadastrado"
      });
    }

    const senhaHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: senhaHash
      }
    });

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso",
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "E-mail já cadastrado" });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Email e senha são obrigatórios"
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!usuario) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos"
      });
    }

    const senhaValida = await bcrypt.compare(password, usuario.password);

    if (!senhaValida) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos"
      });
    }

    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    return res.status(200).json({
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email
      },
      token
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
}
