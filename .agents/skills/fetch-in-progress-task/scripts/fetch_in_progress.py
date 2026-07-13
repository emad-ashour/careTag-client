#!/usr/bin/env python3
import os
import json
import urllib.request

def get_token():
    # 1. Check environment
    token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN")
    if token:
        return token
    # 2. Check mcp_config.json
    config_path = os.path.expanduser("~/.gemini/config/mcp_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                config = json.load(f)
                token = config.get("mcpServers", {}).get("github-mcp-server", {}).get("env", {}).get("GITHUB_PERSONAL_ACCESS_TOKEN")
                if token:
                    return token
        except Exception:
            pass
    return None

def fetch_in_progress():
    token = get_token()
    if not token:
        print("Error: GITHUB_PERSONAL_ACCESS_TOKEN not found in environment or ~/.gemini/config/mcp_config.json")
        return

    req = urllib.request.Request(
        "https://api.github.com/graphql",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        },
        data=json.dumps({
            "query": """
            query {
              organization(login: "care-tag") {
                projectV2(number: 1) {
                  items(first: 20) {
                    nodes {
                      content {
                        ... on Issue {
                          number
                          title
                          body
                          url
                          labels(first: 5) {
                            nodes {
                              name
                            }
                          }
                        }
                      }
                      fieldValues(first: 10) {
                        nodes {
                          ... on ProjectV2ItemFieldSingleSelectValue {
                            name
                            field {
                              ... on ProjectV2FieldCommon {
                                name
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """
        }).encode("utf-8")
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode("utf-8"))
            if "errors" in data:
                print("API Errors:", data["errors"])
                return
            items = data.get("data", {}).get("organization", {}).get("projectV2", {}).get("items", {}).get("nodes", [])
            in_progress_items = []
            for item in items:
                status = None
                for val in item.get("fieldValues", {}).get("nodes", []):
                    if val and val.get("field", {}).get("name") == "Status":
                        status = val.get("name")
                        break
                if status == "In progress":
                    content = item.get("content", {})
                    if content:
                        in_progress_items.append(content)
            
            if not in_progress_items:
                print("No tasks are currently In Progress.")
            else:
                for idx, issue in enumerate(in_progress_items, 1):
                    labels = [l.get("name") for l in issue.get("labels", {}).get("nodes", [])]
                    print(f"--- Task {idx} ---")
                    print(f"Title: {issue.get('title')}")
                    print(f"Number: #{issue.get('number')}")
                    print(f"URL: {issue.get('url')}")
                    print(f"Labels: {', '.join(labels)}")
                    print(f"Description:\n{issue.get('body')}\n")
    except Exception as e:
        print(f"Failed to fetch project board: {e}")

if __name__ == "__main__":
    fetch_in_progress()
