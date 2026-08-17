import os

keywords = ["forgot", "reset", "email", "mail", "otp", "send_otp", "send"]
workspace = r"c:\Users\Manobhiram\AndroidStudioProjects\CerviScan"

results = []
for root, dirs, files in os.walk(workspace):
    # Skip build, gradle, idea, git, kotlin directories
    dirs[:] = [d for d in dirs if d not in (".git", ".gradle", ".idea", ".kotlin", "build", "gradle", "scratch")]
    for file in files:
        if file.endswith((".kt", ".xml", ".php", ".py", ".json", ".properties", ".txt")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for i, line in enumerate(f, 1):
                        line_lower = line.lower()
                        for kw in keywords:
                            if kw in line_lower:
                                results.append((path, i, kw, line.strip()))
                                break
            except Exception as e:
                pass

print(f"Found {len(results)} matches.")
for path, line_no, kw, content in results[:100]:
    rel_path = os.path.relpath(path, workspace)
    print(f"{rel_path}:{line_no} [{kw}] -> {content[:100]}")
