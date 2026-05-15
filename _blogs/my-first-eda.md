---
title: Kicking off my first EDA
date: 2024-07-24
tags: [EDA, data-science, FIFA]
excerpt: "A deep dive into FIFA data, exploring player stats, club dynamics, and uncovering hidden patterns. Join me on this football-fueled data adventure!"
---


> _“Three days of coding, one UCL match, and endless coffees later…”_

![created with ideogram.ai](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*GSkzvPLUjt-cupzyq3UFAQ.png)

Well !! I tried combining my love for football with data science….

> Disclaimer: I’m not a pro data scientist — yet. Just a football fan who took a deep dive into machine learning. Expect some twists, turns, and a few ‘Wait, what?’ moments along the way.”

The Journey Map
---------------

```
Day 1: Data Cleaning → Day 2: EDA + UCL Magic → Day 3: Final Insights
```

Day 1: Operation Clean-Up
-------------------------

> Before:

![Before Cleaning of FIFA data](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*WEAdYiw1FwFw-XCyjk3qOg.png)

> After:

![captionless image](https://miro.medium.com/v2/resize:fit:1120/format:webp/1*v1CHNfP1H_LPZ9mxAVCuyg.png)![After Cleaning and splitting of FIFA Dataset](https://miro.medium.com/v2/resize:fit:882/format:webp/1*2eFhYFedmFg5aJUlfjNDXw.png)

Starting with the basics — data cleaning. Already being familiar with pandas and numpy made this part surprisingly smooth.

Organized 19,000+ players (yes, I counted) into clear categories:

*   Player Name
*   Club
*   Skills
*   Body Stats
*   Player Finance
*   Player International

Day 2: EDA day → The Question Marathon (feat. An Epic UCL Night)
----------------------------------------------------------------

![Barca-4 / Bayern- 1](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*baSezfib6dYmp3QHQKsCxw.png)

> It’s 1 AM, and here I am, deep into analyzing emerging players from 2022 (yes, really). Suddenly, Barcelona vs. Bayern Munich kicks off in the Champions League →a match I’ve been waiting for long to watch. What a game it turned out to be! And Pedri? Absolutely astonishing. Easily one of the best matches I’ve seen in a long time

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*8IeMi6hxlJ7L_t9AzikXFg.png)

Post-match, fueled by football excitement, I tackled these burning questions:

**1.Built the “Moneyball Dream Team” — best players over 75+ rating with lowest possible price (there are some serious bargains out there!)**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Ku32NbVWINY5-A7HcDhPWQ.png)

**2.Found out which countries are producing the next generation of stars (Estonia, Burkina Faso, and Egypt, surprisingly!)**

![captionless image](https://miro.medium.com/v2/resize:fit:874/format:webp/1*E4xzJ_U5PvxgzFRCNtgCPQ.png)![captionless image](https://miro.medium.com/v2/resize:fit:1022/format:webp/1*LEd9v1fefftnsxGQb7EOWQ.png)

**3. Discovered the most and less balanced players above 75 overall (mostly midfielders, as it turns out)**

![fig showing midfielders’ve the most balanced stats](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*mkE71x8DgYxAD4fjmKnjlA.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*MoJuUWjj62plzg9vNT8mCw.png)

**4. Investigated how club loyalty affects player ratings (spoiler: it matters more in top leagues** PL, La Liga, Bundesliga**)**

![days in club vs overall rating](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*gRvb9dU-GTlvLeu_-Bsmdw.png)

**5. Analyzed Premier League clubs’ (top 5 and bottom 5) work rates vs. finances (fascinating correlation there)**

_Manchester City has biggest work rate along with biggest wage and value. Chelsea, despite being one of the best teams, have an inappropriately low work rate, unlike Leeds United_

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*sRqsU9O5aPekNOdCo1Fz5g.png)![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*R7FsIMGurW-ibfdjBhlgLw.png)

**6. Deep-dove into Brazilian clubs having the highest percentage of home country players**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*uO4-wN7tLGepr0ggkbjPcA.png)

**7. Which leagues gathers most market value in players?**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*jWkvU_JrrUnhr-5ZPUX8mA.png)

**8. Compared Ramos vs. Van Dijk (sorry VVD fans, but Ramos’s sliding tackle game is unmatched)**

![captionless image](https://miro.medium.com/v2/resize:fit:1274/format:webp/1*K3PFqTLjS7vYRy3m1h4sGQ.png)

_Ramos is better at passing and dribbling to help midfielder in attacking along with defending with his favourite sliding tackle haha.Dijk is better defending as his defending, pace and physical is better than Ramos.who won? i can’t tell, they’re both goat for me_

**9. Left foot Vs Right foot**

![right players amount > left players amount](https://miro.medium.com/v2/resize:fit:930/format:webp/1*5OB-dQupKOuncSKmslc_Ng.png)

Day 3: Getting Technical — Final Insights
-----------------------------------------

### The ML Journey:


```
My_Brain = {
    "Morning": "What is sklearn?",
    "Afternoon": "Maybe I'm getting it",
    "Evening": "Let's leave it for 100daysOfML"
}
```

First time using sklearn — shoutout to the [internet](https://www.youtube.com/watch?v=0B5eIE_1vpU&t=6575s) for the 3-hour crash course!

_Didn’t quite finish it, but no worries, I’ll be back for more soon ❤._

### Hidden Patterns:


**Applied Kmeans Clustering to find the Basic patterns (** _its github copilot who’s helping me for this one_**😂):**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*jrZdt9iRDIimBmWyGW7QGw.png)

_the higher the shooting and dribbling skills, the better the player_

**Through PCA and clustering:**

*   Mbappé emerged as a statistical outlier
*   Most players share common skill patterns

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*zuWaMYPleEboEcFQjCIWkw.png)

### And the finally The GOAT 
![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*nvFjW0kpzuKBenkT6sxrnQ.png)

*   **Messi** tops the charts by rating again, king of football
*   **Lewandowski** close second with scoring 50 goals a season, goal machine
*   **Ronaldo** is still holding at 3rd despite his age, truly legend

> But let’s be real, no spreadsheet is gonna settle the GOAT debate.Whether you’re chanting for Messi or Ronaldo, these stats won’t change the fact that every fan has their own GOAT. so let’s just agree on one thing: we’re all lucky to watch these legends do their thing. 🙌

> Here is my goat for you — — ANTONY the legend😅

![captionless image](https://miro.medium.com/v2/resize:fit:440/format:webp/1*amMN-sZgRHLe0pZsVJrTNA.gif)

### Resources & Links:


*   FIFA 22 [**_Dataset_**](https://www.kaggle.com/datasets/stefanoleone992/fifa-22-complete-player-dataset)

### [FIFA 22 complete player dataset


### 19k+ players, 100+ attributes extracted from the latest edition of FIFA

www.kaggle.com](https://www.kaggle.com/datasets/stefanoleone992/fifa-22-complete-player-dataset)

*   Analysis GitHub [**_Repo_**](https://github.com/paudelsamir/LearningUtsav-30DaysOfLearning/tree/main/Day%2020%20-%20EDA%20Project%20%40%20Final%20Insights): (you can use the notebook from github)


**_Here is a final documentation on My EDA Project:_**

![captionless image](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*ynlxRg7Xo4N-PrG7XIbswA.png)

So yes , This much for today. Thank you !!