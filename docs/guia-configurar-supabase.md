# Guía: conectar Supabase (paso a paso)

Supabase es donde vivirán la base de datos, el login y los documentos de la
plataforma. Es gratuito para empezar. Sigue estos pasos con calma.

---

## Paso 1 · Crear la cuenta

1. Entra en **https://supabase.com** y pulsa **"Start your project"**.
2. Regístrate (lo más fácil: **"Continue with GitHub"**, con tu cuenta
   `angelicalatam`).

## Paso 2 · Crear el proyecto

1. Pulsa **"New project"**.
2. Rellena:
   - **Name:** `arkan-plataforma`
   - **Database Password:** crea una contraseña y **guárdala** (la necesitarás
     para copias de seguridad; no es la de tu login).
   - **Region:** elige **`West EU (Ireland)`** o **`Central EU (Frankfurt)`**
     👉 importante: en Europa, por el RGPD.
3. Pulsa **"Create new project"** y espera 1-2 minutos a que se prepare.

## Paso 3 · Crear las tablas (ejecutar el SQL)

1. En el menú izquierdo de Supabase, abre **SQL Editor**.
2. Pulsa **"New query"**.
3. Abre en tu ordenador el archivo:
   `plataforma-arkan/supabase/migrations/0001_fundacion.sql`
4. Copia **todo** su contenido, pégalo en el editor y pulsa **"Run"**
   (o `Ctrl + Enter`).
5. Debe aparecer **"Success. No rows returned"**. ✅

## Paso 4 · Copiar las claves

1. En el menú izquierdo: **Project Settings** (el engranaje) → **API Keys**.
2. Verás dos datos que necesitamos:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public** (una clave larga)

## Paso 5 · Pegar las claves en la app

1. En la carpeta `plataforma-arkan`, busca el archivo `.env.local.example`.
2. Haz una copia y renómbrala a **`.env.local`** (sin `.example`).
3. Ábrela con el Bloc de notas y pega tus valores:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
   ```
4. Guarda el archivo.

> 💡 Dímelo cuando llegues aquí y yo creo el `.env.local` por ti si prefieres:
> solo pégame en el chat la **URL** y la clave **anon** (son claves públicas,
> es seguro).

## Paso 6 · Crear tu usuario administrador

1. En Supabase: **Authentication** → **Users** → **"Add user"** →
   **"Create new user"**.
2. Escribe tu **email** (`angelica@arkanreformas.es`) y una **contraseña**.
3. Marca **"Auto Confirm User"** para poder entrar sin verificar el correo.
4. Pulsa **"Create user"**.
   👉 Al ser el **primer** usuario, la plataforma te asigna el rol
   **Administrador** automáticamente.

## Paso 7 · Entrar

1. Reinicia el servidor: para el que está corriendo (`Ctrl + C` en la terminal)
   y ejecuta de nuevo `npm run dev`.
2. Abre **http://localhost:3000**, escribe tu email y contraseña y pulsa
   **Entrar**. 🎉

---

### ¿Algo no funciona?
- Si el login dice "Supabase aún no está conectado": revisa que `.env.local`
  tiene las dos claves y que reiniciaste `npm run dev`.
- Si el SQL da error: asegúrate de haber copiado el archivo **completo**.
- Ante cualquier duda, cuéntamelo en el chat y lo resolvemos juntas.
