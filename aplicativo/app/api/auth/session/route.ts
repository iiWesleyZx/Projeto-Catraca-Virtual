import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/lib/auth";

export async function GET() {
  const usuario = await obterUsuarioAutenticado();

  if (!usuario) {
    return NextResponse.json(
      { autenticado: false, usuario: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    autenticado: true,
    usuario,
  });
}
