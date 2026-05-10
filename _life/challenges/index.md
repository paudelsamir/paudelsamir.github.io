---
layout: default
title: Challenges
---

{% assign challenges = site.life | where_exp: "c","c.path contains 'challenges/'" %}

{% assign total_days = 0 %}
{% assign completed_days = 0 %}
{% for c in challenges %}
	{% assign days = c.days | default: 30 %}
	{% assign comp = c.completed | default: 0 %}
	{% assign total_days = total_days | plus: days %}
	{% assign completed_days = completed_days | plus: comp %}
{% endfor %}

{% if total_days > 0 %}
	{% assign pct = completed_days | times: 100 | divided_by: total_days %}
	<p><strong>Overall progress:</strong> {{ pct }}% ({{ completed_days }} / {{ total_days }} days)</p>
{% else %}
	<p><strong>Overall progress:</strong> 0%</p>
{% endif %}

Browse individual challenges below.

{% for c in challenges %}
	<h3><a href="{{ c.url }}">{{ c.title }}</a></h3>
	<p>Days: {{ c.days | default: 30 }} · Completed: {{ c.completed | default: 0 }}</p>
{% endfor %}


## links