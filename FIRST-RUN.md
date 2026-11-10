# Taxis ko pehli baar kaise use karein

Preview mein Taxis kholo. Yeh hospital software ka learning prototype hai; fictional visitors aur rooms hi use karo. Abhi tumhari demo state sirf current browser tab mein hai, shared database mein nahi.

## 5-minute walkthrough

Pehle **New token** click karo. Label blank chhodne par `Visitor 009` jaisa fictional label aayega; standard/assisted category choose kar sakte ho. Real naam, medical details, phone number ya documents enter mat karo.

**All active / Waiting / In care / Finished** tabs aur search se queue dekho. Sample mein ek standard visitor ka ageing boost hai; woh 30 minutes se zyada wait kar chuka hai. Isliye assisted category ka naam hone ka matlab hamesha sabse pehle aana nahi—boosted tokens ke beech arrival order decide karta hai.

Right panel mein available room ke liye **Call next** karo. Token `in_consultation` ho jayega aur room busy dikhega. **Complete visit** par room available aur token completed ho jayega. Active table row ka left arrow visitor ko wapas waiting queue mein bhejta hai.

Coffee/break button se free room ko unavailable kar sakte ho, aur wahi button wapas available karta hai. Busy consultation ke dauran doctor ka arbitrary status change allowed nahi. Jab rooms pause hote hain, future wait estimates unhe exclude karte hain.

**Rules & estimates** screen kholo. Priority kaise calculate hoti hai aur fictional 12/18/20-minute room assumptions kya hain, yahan explained hai. **Start with an empty queue** current tokens/events ko confirmation ke baad clear karega, lekin rooms ready rahenge.

**Activity log** actual session actions dikhata hai. **Reset demo** confirmation ke baad sample data reload karta hai. Refresh se session usually rehta hai; tab close karne par usually clear hota hai, lekin browser session restore use retain kar sakta hai.

## Code ko simple words mein samjho

`shared/queue.ts` actual queue engine hai: React se independent functions hain. Har action old object mutate karne ke bajay naya state return karta hai. Isse tests clearly compare kar paate hain ki action se pehle aur baad kya badla.

`Home.tsx` screen aur actions ko connect karta hai. `DoctorPanel.tsx` rooms ke controls hai. `IntakeDialog.tsx` fictional token input hai. `demoStorage.ts` browser session snapshots ko validate karta hai, taaki damaged state invalid consultation ya Date-render crash na create kare.

`pnpm test` saved automated cases chalaata hai. `pnpm check` TypeScript problems dekhta hai. Passing checks useful evidence hain, lekin production safety, hospital compliance ya Alignerr selection ki guarantee nahi.

## Apna first contribution

Pehle bina code badle workflow samjho. Phir ek chhota real improvement choose karo: explanatory copy improve karo, scheduling tie-break ke liye extra test likho, ya state controller ko alag module mein refactor karo. Change ka reason samjho aur actual date par commit karo. Fake users, deployment claims ya purani Git history ki zaroorat nahi.

Next: [GitHub zero se](GITHUB-START-HERE.md).
