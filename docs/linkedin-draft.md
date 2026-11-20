# LinkedIn Build-in-Public Post Draft

---

It’s 7:00 AM on a Tuesday morning in Delhi.

You wake up, look out the window, and can barely see the streetlight across the road. You open your weather app: **AQI 312 — Very Poor**.

Now you’re standing in your kitchen asking yourself:
- Can my 8-year-old go out for school sports today?
- My mother has asthma and we don't own an expensive air purifier—what can we actually do right now?
- Is it safe to open the windows at noon, or will that make it worse?

An AQI number alone doesn't answer any of these questions. It just causes anxiety.

For **PromptWars Virtual Challenge 06 (Urban Air Quality Assistant)**, I built **AiroG** (*Airo* for air + *G* for guardian).

**The mission in one line:** *Clear air, made simple — converting overwhelming winter smog numbers into a personalized, low-emission daily routine for Indian families.*

Here is what makes AiroG fundamentally different from traditional weather apps:

1. **The "Best Outdoor Window":** Air pollution isn’t flat. In Indian winter, nighttime thermal inversions trap smoke near the ground, causing smog to peak around 8:00 PM. But between 2:00 PM and 4:00 PM, midday warmth breaks the inversion. AiroG identifies this window automatically and schedules your essential errands when the air is cleanest.
2. **GenAI for Habits, Pure Math for Numbers:** We use Google Gemini to draft practical routines, indoor hacks, and greener alternatives based on your household (kids, elders, asthma, purifier). But we strictly forbid the AI from inventing numbers. Every AQI band, every CPCB sub-index, and every impact metric is calculated deterministically in TypeScript.
3. **Transparent Impact & A 0–100 Exposure Score:** No fake claims like "reduces pollution by 34.2%". AiroG provides a deterministic 0–100 daily exposure score that updates as you adopt protections. And if a suggestion (like drinking warm water) is just supportive comfort? We say it plainly: *"Comfort, not exposure."*
4. **Built for Performance & Accessibility:** Full keyboard navigation, high-contrast WCAG 2.1 compliance, 100% strict TypeScript with zero `any`, and aggressive code-splitting that reduced our initial JS bundle down to 186.93 kB (well under 190 kB).

In Challenge 05, my project *Planovent* scored 94.47/100 (Rank #540 of 51,762). This time, the goal is Rank #1.

Experience the live app and let me know your thoughts:
🔗 **Live Demo:** https://airog.vercel.app  
💻 **Open-Source Code:** https://github.com/akmal-07/AiroG  

Would love feedback from parents, developers, and anyone navigating winter smog in India! 🇮🇳

#BuildWithAI #GoogleForDevelopers #PromptWars #GenAI #AirQuality #React #TypeScript #Vite #PublicHealth #CleanAir
