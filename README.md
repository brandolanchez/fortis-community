# Fortis Community Hub

<div align="center">
  <img src="app/icon.png" alt="Fortis Workout Logo" width="120" />
  <h1>Fortis Community Hub</h1>
  <p><strong>The Decentralized Social Platform for Calisthenics Athletes</strong></p>
  <p>
    Powered by <a href="https://hive.io">Hive Blockchain</a> • Customized for <a href="https://fortisworkout.org">Fortis Workout</a>
  </p>
</div>

---

## 🏋️ About The Project

**Fortis Community Hub** is the dedicated social layer for the Fortis Workout community in Maracaibo. It serves as a decentralized space where athletes can share their progress, engage in discussions, and monetize their content without intermediaries.

Built on top of the **Hive Blockchain**, this application ensures that every post, comment, and upvote is immutable and owned by the creator. It seamlessly integrates with the main [Fortis Workout](https://fortisworkout.org) website, powering the blog section with community-generated content.

### Key Features
*   **⚡ Snaps Feed**: Twitter-like short-form content for quick updates, workout clips, and daily motivation. optimized for high performance with **parallel blockchain fetching**.
*   **📝 Long-form Blog**: A full-featured blogging platform where athletes can publish detailed training logs, tutorials, and nutrition guides.
*   **🔗 Hybrid Integration**: Posts created here are automatically synced and displayed on the official `fortisworkout.org` blog widget.
*   **🔐 Web3 Native**: Login securely with **Hive Keychain**. Your keys, your data, your assets.
*   **🎨 Fortis Gold Theme**: A custom-designed UI matching the premium "Fortis Gold" & "Rich Black" aesthetic of the main brand.

---

## 🚀 Optimized Technology

This version of the software includes specific performance enhancements tailored for the Fortis community tag (`hive-148971`):

*   **Parallel Feed Fetching**: The core engine has been upgraded to fetch threads in parallel batches (20x speed improvement), eliminating "infinite load" times for filtered community feeds.
*   **Smart Caching**: Minimizes RPC node strain while ensuring fresh content delivery.
*   **Adaptive Layout**: Fully responsive interface that works perfectly on mobile devices during workouts.

### Tech Stack
*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **UI Library**: [Chakra UI](https://chakra-ui.com/) + Custom Fortis Theme
*   **Blockchain**: [Hive](https://hive.io/) via `@hiveio/dhive`
*   **Authentication**: Hive Keychain
*   **Styling**: Tailwind CSS

---

## 🛠️ Deployment & Configuration

This project is deployed on **Netlify** and acts as a subdomain extension (`community.fortisworkout.org`).

### Environment Variables
To replicate this environment, configure the following keys:

```bash
# Theme Configuration
NEXT_PUBLIC_THEME=fortis-workout

# Community Identification
NEXT_PUBLIC_HIVE_COMMUNITY_TAG=hive-148971
NEXT_PUBLIC_HIVE_SEARCH_TAG=hive-148971

# Frontend Customization
NEXT_PUBLIC_HIVE_USER=fortisworkout
```

---

## 🤝 Contribution

This is an open-source initiative to empower the calisthenics community through decentralization.

1.  **Report Issues**: If you find a bug, please open an issue.
2.  **Submit PRs**: Improvements to the feed logic or UI are welcome.

---

<div align="center">
  <sub>Built with 💪 and code for <strong>Fortis Workout</strong></sub>
</div>
