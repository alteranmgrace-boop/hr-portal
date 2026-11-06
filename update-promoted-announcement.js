const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hr-portal.db');

const title = "Newly Promoted and Appointed Personnel";
const content = "WVSGH HRMO proudly congratulates the newly promoted and appointed personnel who took their oath of office on October 26, 2026.";
const category = "governance";
const date = "2026-10-26";

const fullNews = `<div class="announcement-celebration">
  <p>The <strong>WVSGH Human Resource Management Office (HRMO)</strong> proudly congratulates the newly promoted and appointed personnel who took their oath of office on <strong>October 26, 2026</strong>.</p>

  <h3>Medical Division</h3>
  <ul>
    <li><strong>Dr. Grace G. Cejar</strong> — Medical Specialist II (Full-Time)</li>
    <li><strong>Dr. Maria Amelia H. Sornito</strong> — Medical Officer III</li>
    <li><strong>Dr. Eshre Rei N. Jucal</strong> — Medical Officer III</li>
    <li><strong>Dr. Lady Alexah C. Banuag</strong> — Medical Officer III</li>
    <li><strong>Dr. Ed Marie D. Gonzaga</strong> — Medical Officer III</li>
    <li><strong>Dr. Christopher John Jericho Balicanta</strong> — Medical Officer III</li>
    <li><strong>Dr. Ma. Theresa M. Arbizo</strong> — Medical Officer III</li>
    <li><strong>Ms. Jenny Rose C. Porras</strong> — Administrative Assistant I</li>
    <li><strong>Ms. Sheryl P. Suplido</strong> — Administrative Assistant I</li>
  </ul>

  <h3>Nursing Department</h3>
  <ul>
    <li><strong>Mr. Alvin Willem T. Ting</strong> — Nurse II</li>
    <li><strong>Ms. Cynthia S. Etanong</strong> — Nurse II</li>
    <li><strong>Ms. Kimberly Rose G. Orbina</strong> — Nurse II</li>
    <li><strong>Mr. Ian Mark M. Mabad</strong> — Nurse II</li>
    <li><strong>Ms. Madeilene P. Simoy</strong> — Ward Assistant</li>
  </ul>

  <p>May this new chapter bring greater opportunities, continued professional growth, and renewed dedication to public service. May you continue to uphold excellence, integrity, and compassion in serving our patients and the community.</p>
  <p><strong>Congratulations on your well-deserved achievements.</strong></p>
</div>`;

db.serialize(() => {
  db.run(
    "UPDATE announcements SET title = ?, content = ?, full_news = ?, date = ?, category = ? WHERE id = ?",
    [title, content, fullNews, date, category, 20],
    function (err) {
      if (err) {
        console.error("Error updating announcement:", err.message);
      } else {
        console.log("Updated announcement ID 20. Changes:", this.changes);
      }
      db.close();
    }
  );
});