module.exports = function aboutBruno({ version, logoPath }) {
  const currentYear = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes">
        <title>About Curly CATS</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin: 0;
                padding: 10px;
                background-color: #f4f4f4;
                color: #333;
            }
            .logo {
                margin-top: 10px;
            }
            .logo img {
                width: 80px;
                height: 80px;
            }
            .title {
                font-size: 24px;
                margin-top: 8px;
                font-weight: bold;
                color: #222;
            }
            .footer {
                margin-top: 10px;
                padding: 5px;
                font-size: 14px;
                color: #555;
            }
        </style>
    </head>
    <body>
      <div class="logo">
        <img src="file:///${logoPath}" alt="Curly CATS logo" />
      </div>
      <h2 class="title">Curly CATS ${version}</h2>
      <footer class="footer">
          &copy;${currentYear} Curly CATS
      </footer>
    </body>
    </html>
  `;
};
