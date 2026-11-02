---
layout: default
title: Projects
category: home
description: Stuff I've built - ML models, web apps, experiments. Some finished, some not. All open source.
---

# Projects

25+ projects built over time. all opensource, all ideas started somewhere.

## Fullstack AI Applications

{::nomarkdown}
<div class="projects-grid">
{% for project in site.data.projects.fullstack %}
  {% include project-card.html
    title=project.title
    description=project.description
    image=project.image
    demo=project.demo
    code=project.code
    tags=project.tags
  %}
{% endfor %}
</div>
{:/nomarkdown}

## AI/ML & Deep Learning

{::nomarkdown}
<div class="projects-grid">
{% for project in site.data.projects.aiml %}
  {% include project-card.html
    title=project.title
    description=project.description
    image=project.image
    demo=project.demo
    code=project.code
    tags=project.tags
  %}
{% endfor %}
</div>
{:/nomarkdown}


## Linux

{::nomarkdown}
<div class="projects-grid">
{% for project in site.data.projects.omarchy %}
  {% include project-card.html
    title=project.title
    description=project.description
    image=project.image
    demo=project.demo
    code=project.code
    tags=project.tags
  %}
{% endfor %}
</div>
{:/nomarkdown}

## Collections

{::nomarkdown}
<div class="projects-grid">
{% for project in site.data.projects.collections %}
  {% include project-card.html
    title=project.title
    description=project.description
    image=project.image
    code=project.code
    tags=project.tags
  %}
{% endfor %}
</div>
{:/nomarkdown}

## Miscellaneous

{::nomarkdown}
<div class="projects-grid">
{% for project in site.data.projects.more %}
  {% include project-card.html
    title=project.title
    description=project.description
    image=project.image
    demo=project.demo
    code=project.code
    tags=project.tags
  %}
{% endfor %}
</div>
{:/nomarkdown}

## Others

{::nomarkdown}
<details style="margin: 2rem 0;">
<summary style="cursor: pointer; color: var(--text-main); font-weight: 500; padding: 0.5rem; display: block;">Show more projects (13)</summary>
<div style="margin-top: 1.5rem;">

<table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
<thead>
<tr style="border-bottom: 1px solid var(--border);">
<th style="text-align: left; padding: 0.75rem; color: var(--text-main); font-weight: 500;">Project</th>
<th style="text-align: left; padding: 0.75rem; color: var(--text-main); font-weight: 500;">Category</th>
<th style="text-align: left; padding: 0.75rem; color: var(--text-main); font-weight: 500;">Description</th>
<th style="text-align: left; padding: 0.75rem; color: var(--text-main); font-weight: 500;">Links</th>
</tr>
</thead>
<tbody>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Spotify Clone</td>
<td style="padding: 0.75rem;">Web</td>
<td style="padding: 0.75rem;">full-stack music app. auth, playlists, queuing. vibing with code.</td>
<td style="padding: 0.75rem;"><a href="https://spotify-profile-233.herokuapp.com/" target="_blank" style="text-decoration: underline;">demo</a> / <a href="https://github.com/paudelsamir/spotify-clone" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Netflix Clone</td>
<td style="padding: 0.75rem;">Web</td>
<td style="padding: 0.75rem;">streaming ui, backend logic. dark mode by default.</td>
<td style="padding: 0.75rem;"><a href="https://netflix-clone.herokuapp.com/" target="_blank" style="text-decoration: underline;">demo</a> / <a href="https://github.com/paudelsamir/netflix-clone" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Blackjack Game</td>
<td style="padding: 0.75rem;">Games</td>
<td style="padding: 0.75rem;">classic card game. hit, stand, win. python console vibes.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2006-Blackjack%20Project/blackjack.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Snake Game</td>
<td style="padding: 0.75rem;">Games</td>
<td style="padding: 0.75rem;">ai-powered snake. self-learning, self-destroying. retro chaos.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2020-%20Snake%20Game%20Project/snake.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Hangman Game</td>
<td style="padding: 0.75rem;">Games</td>
<td style="padding: 0.75rem;">word guessing. terminal-based. simple, classic, fun.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2007-Hangman%20Project/hangman.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Higher Lower Game</td>
<td style="padding: 0.75rem;">Games</td>
<td style="padding: 0.75rem;">guess the bigger number. probability meets chance.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2014-Higher%20Lower%20Game%20Project/game.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Number Guessing Game</td>
<td style="padding: 0.75rem;">Games</td>
<td style="padding: 0.75rem;">binary search meets randomness. find the number.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2012-%20Scope%20&%20Number%20Guessing%20Game/number_guessing_game.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Caesar Cipher</td>
<td style="padding: 0.75rem;">Tools</td>
<td style="padding: 0.75rem;">encryption basics. shift, decrypt, repeat. cryptography 101.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2008-Caesar%20Cyphers%20And%20function%20Parameters/caesar-cyphers.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Calculator</td>
<td style="padding: 0.75rem;">Tools</td>
<td style="padding: 0.75rem;">basic arithmetic, modular design. calculating made clean.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2010-Building%20Calculator%20Using%20Function%20Parameters/calculator.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Coffee Machine</td>
<td style="padding: 0.75rem;">Tools</td>
<td style="padding: 0.75rem;">state management via code. order, process, serve. ☕</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2015-%20Building%20%20Simple%20Coffee%20Machine/coffee_machine.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Quiz Application</td>
<td style="padding: 0.75rem;">Tools</td>
<td style="padding: 0.75rem;">q&a engine. scoring, progression. learning through games.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2017-%20The%20quiz%20project/main.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
<tr style="border-bottom: 1px solid var(--border);">
<td style="padding: 0.75rem;">Turtle & GUI</td>
<td style="padding: 0.75rem;">Tools</td>
<td style="padding: 0.75rem;">graphics, animations. drawing with code. tkinter experiments.</td>
<td style="padding: 0.75rem;"><a href="https://github.com/paudelsamir/python-mastery/blob/main/Day%2018-%20Turtle%20and%20GUI/turtle_race.py" target="_blank" style="text-decoration: underline;">code</a></td>
</tr>
</tbody>
</table>


</div>
</details>
{:/nomarkdown}


see my [uses](/uses/) for the stack. check [about](/about/) for my dev journey.
