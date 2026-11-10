# GitHub zero se — Divyansh ke liye

GitHub pehle se aana zaroori nahi. Is project ko use karte-karte sirf kuch concepts seekhne hain. Account khaali hone ka matlab bas yeh hai ki tumhari pehli repository ab banegi; isse project banana nahi rukta.

## Teen words, simple meaning

| Word | Simple meaning |
|---|---|
| Repository / repo | Ek project ka folder, uska code, README aur saved history |
| Commit | Code ki ek saved version, saath mein message ki kya badla |
| Push | Local saved commits ko GitHub par bhejna |
| README | Project ke front page ki explanation: kya hai, kaise chalta hai, limitations |
| Clone | GitHub se project ki working copy apne computer par lana |

Git aur GitHub alag hain: Git versions save karta hai; GitHub unhe online rakhne aur share karne ka service hai. GitHub khaali ho sakta hai, lekin tumhara experience/resume alag cheez hai. Naye repo ki history ko purana dikhana zaroori nahi aur aisa nahi karna.

## 1. Account ready karna

Apne browser mein `https://github.com` kholo. Account hai to sign in karo; nahi hai to account banao. Password, OTP ya recovery codes chat mein mat bhejna. Apne account mein two-factor authentication enable karna sensible hai; recovery codes privately sambhalna.

## 2. Manus se source save/connect karna

Is task mein Manus ke GitHub connection/repository card se project connect hoga. Apna GitHub account authorise karo aur proposed **new private repository** ko confirm karo. Suggested name: `taxis-clinic-queue-lab`. Existing repo par overwrite nahi hoga. Card mein jo final owner/repo choose hota hai wahi actual destination hai; mere suggested name ko completed upload mat samajhna.

Private repo ka code sirf authorised viewers dekh sakte hain. Alignerr ko tum GitHub connect karte waqt alag permission dene ki zaroorat ho sakti hai; private repo automatically visible nahi maana ja sakta. Permission screen par scope samajhkar approve karna. Repository ko public karna ek separate choice hai—sirf tab jab tum files aur privacy check kar lo.

GitHub transfer tab complete maana jayega jab push aur connection verification dono successful hon. Code Preview mein chalna ya Manus par checkpoint save hona apne aap GitHub upload nahi hai.

## 3. GitHub par kya check karna hai

Final repository link milne ke baad usmein `README.md`, `shared/queue.ts`, `client/src/pages/Home.tsx`, test files aur `package.json` dikhne chahiye. README project ka front page banega. Is guide mein repository link invent nahi kiya gaya—actual confirmed link handoff mein milega.

## 4. Computer par project chalana

Sabse aasaan non-command-line option **GitHub Desktop** hai. Use install karke apne GitHub account se sign in karo, phir **File → Clone Repository** se actual repo choose karo. **Repository → Open in Visual Studio Code** se project kholo.

Node.js 22 LTS aur VS Code installed hon to VS Code mein **Terminal → New Terminal** kholo. Terminal project folder mein hona chahiye. Run:

```bash
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
pnpm dev:static
```

Default local address `http://localhost:3000` hai. Port already occupied ho to pehle us process ko identify karo; bina samjhe terminate mat karo. Windows machine par agar Corepack available na ho, pinned pnpm ko `npm install --global pnpm@10.18.0` se install kar sakte ho. Admin permission issue aaye to exact error ke saath help lo—random install scripts mat run karo.

**Demo queue chalane ke liye database, API key, paid AI subscription ya GitHub token ki zaroorat nahi.** Generated brand icon ki copy repository mein included hai, isliye local clone mein bhi favicon asset available hai.

## 5. Apna pehla genuine change

Pehle app use karo: naya fictional token issue karo, room ka break toggle karo, next visitor call karo, consultation complete karo, rules aur activity log dekho. Phir ek chhota change apne aap try karo, jaise explanatory copy improve karna ya ek missing regression test add karna. Is change ka reason samjho.

Check:

```bash
pnpm check
pnpm test
pnpm build:static
```

GitHub Desktop mein changed files review karo. Summary likho, e.g. `Explain assisted queue category more clearly`, phir **Commit to main** aur **Push origin**. Secrets, `.env`, personal documents ya payment data commit mat karna.

Command-line se equivalent workflow:

```bash
git status
git diff
# Sirf intended files stage karo:
git add client/src/pages/Home.tsx
git commit -m "Clarify demo queue explanation"
git push
```

## 6. Project ko explain karne ki practice

Yeh project **abhi banaya gaya AI-assisted prototype** hai. Isko 2 saal se maintained system, real hospital deployment ya client work mat batana. AI-assisted code hona automatically selection ka proof ya disqualification nahi; actual opportunity ki requirements follow karni hain.

Apne words mein batana seekho: assisted aur aged-standard tokens ka order kyun aisa hai; busy/unavailable rooms mein estimate kaise badalta hai; invalid transition kaise reject hota hai; session storage database se kaise alag hai. Agar tum yeh samajhkar code change aur tests improve kar sakte ho, repository tumhare liye meaningful learning project banegi.

## Next milestone

Pehla milestone ek samjha hua, runnable project hai—not artificial contribution streaks ya bahut saare empty repos. Iske baad genuine issues/improvements par kaam karenge. Doosra project tab banana jab is pehle wale ka basic architecture aur workflow tum comfortable explain kar sako.
