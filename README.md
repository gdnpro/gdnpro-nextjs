# → GDN Pro | Página Oficial ←

<!-- <a href="https://github.com/RikiRilis/stop-trivia-react">
  <img src="https://rikirilis.com/images/stop-trivia.webp" />
</a> -->

[Visit it →](https://gdnpro.com)

## 📃 Descripción →

Este repositorio contiene el código general de la página oficial de GDN Pro, construida en [React](https://react.dev) con [Tailwind](https://tailwindcss.com), [Supabase](https://supabase.com), y desplegada en [Vercel](https://vercel.com).

## 🤝 Puedes usar este repositorio siguiente los pasos a continuación →

### 🚀 Empecemos

Sigue estos pasos para configurar y ejecutar el proyecto GDN Pro en tu entorno local:

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/gdnpro/gdnpro.git
   ```

2. **Entra en la carpeta del proyecto**
   ```bash
   cd gdnpro
   ```

3. **Instala las dependencias usando pnpm**
   ```bash
   npm install
   ```

4. **Inicia el proyecto**
   ```bash
   npm run dev
   ```

## ⚙️ Características Principales
### Toast
Para mostrar un Toast en cualquier parte de la aplicación, simplemente usa:

```js
window.toast({
  title: "Mensaje para mostrar",
  type: "success", // 'success', 'error', 'warning', 'info'
  location: "bottom-center", // Opciones: 'top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'
  dismissible: true, // (opcional) permite cerrar el toast manualmente
  icon: true // (opcional) muestra un ícono según el tipo
})
```

Ejemplo rápido:
```js
window.toast({
  title: "Inicio de sesión exitoso",
  type: "success",
  location: "bottom-center"
})
```

El Toast puede usarse en cualquier archivo JS/TS de frontend donde exista `window`.
