import re

content = open("style.css", "r").read()

# find .nepal-map-container and remove until the comment bar
start = content.find(".nepal-map-container {")
end = content.find("/* ════════════════════════════════════════════\n   Sidebar \"nepal\" link decoration", start)

if start != -1 and end != -1:
    content = content[:start] + content[end:]
    open("style.css", "w").write(content)
    print("Removed old nepal-map styles.")
else:
    print("Could not find blocks.")
