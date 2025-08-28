const BaseTemplate = require("./BaseTemplate");

class WelcomeTemplate extends BaseTemplate {
  constructor({ name }) {
    super("Welcome to Manga Store!");
    this.name = name || "Friend";
  }

  getTemplate() {
    const header = `
      <div class="header" style="background:linear-gradient(135deg,#1f2937,#111827)">
        <div class="logo-badge">
          <img class="icon" src="cid:mango-logo" alt="Manga Store"/>
        </div>
        <h1>Welcome, ${this.name}!</h1>
        <p class="subtext">Your account is ready. Explore top products, earn cashback points, and enjoy exclusive offers.</p>
        <a class="btn" style="background:#f59e0b;border-color:#f59e0b" href="${process.env.PUBLIC_BASE_URL || "http://localhost:3000"}/">Start shopping</a>
      </div>
    `;

    const details = `
      <div style="padding:10px 0;color:#9ca3af">
        <p style="margin:0">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `;

    return this.getBaseHTML(header, details);
  }
}

module.exports = WelcomeTemplate;
