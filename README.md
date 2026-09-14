# מסע בין שתי ההמיספרות

גרסת הפצה ל GitHub Pages.

הקבצים שצריכים להיות בשורש ה repository:

- `index.html`
- `styles.css`
- `app.js`
- `.nojekyll`

## שמירת תשובות

האתר שומר התקדמות מקומית במכשיר ובנוסף מנסה לשמור כל פעילות משמעותית ב Firebase Firestore.
ה collection הוא:

`neuroReviewSubmissions`

לכל מכשיר נוצר session id אקראי. אותו מסמך מתעדכן במהלך העבודה, ולכן גם תשובות חלקיות יכולות להישמר בלי ליצור מסמך חדש על כל הקלדה.

כפתור "שמירה וסיום" מבצע שמירה מיידית נוספת ומסמן את הרשומה כ submitted.

אם Firebase אינו זמין או שההרשאות אינן מאפשרות כתיבה, האתר ממשיך לעבוד והתשובות נשארות שמורות מקומית במכשיר.

## GitHub Pages

ב repository פתחו Settings, אחר כך Pages, ובחרו Deploy from a branch.
בחרו את branch `main` ואת התיקייה `/ (root)` ואז Save.

לאחר ההפצה האתר יהיה זמין בכתובת מהצורה:
`https://USERNAME.github.io/REPOSITORY/`
