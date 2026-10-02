// onlineRunner.js — run the Code Playground's non-JavaScript languages
// through a free public code-execution API.
//
// Why not Piston? The brief named Piston's public API, but as of
// 2/15/2026 it answers every call with HTTP 401 ("Public Piston API is
// now whitelist only") — verified directly against emkc.org. So the
// provider here is Wandbox (https://wandbox.org): free, no key, CORS
// open, and it has real compilers for every language below. The whole
// provider interaction lives in executeOnline() + buildRequest(), so
// swapping providers later is a one-function change.
//
// JavaScript (lib/runCode.js) and SQL (lib/sqlEngine.js) keep running
// 100% locally; only these languages leave the device, and the page
// says so. Failures are honest: network/rate-limit problems surface as
// friendly messages, never as fake output.
//
// Dependency-free + fetch-injectable so the request builder can be
// smoke-tested outside the browser (scripts/smoke-online-runner.mjs).

export const ONLINE_API = 'https://wandbox.org/api/compile.json';

// One entry per language: Wandbox compiler id (checked against
// https://wandbox.org/api/list.json), display label, and starter
// snippets — small prep-flavoured programs that print something, so a
// first Run feels alive.
export const ONLINE_LANGUAGES = [
  {
    id: 'python', file: 'main.py', label: '🐍 Python', compiler: 'cpython-3.13.8',
    snippets: [
      {
        id: 'two-sum', name: '🎯 Two Sum',
        code: `# Two Sum — the hash-map classic. Press Run ▶ (or Ctrl + Enter)
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return []

print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
print(two_sum([3, 2, 4], 6))       # [1, 2]
# TODO: what does two_sum([3, 3], 6) print?`,
      },
      {
        id: 'stdin', name: '⌨️ Read stdin',
        code: `# Reading input: type something in the stdin box under the
# editor (a name on line 1, an age on line 2), then Run.
name = input("Your name: ")
age = int(input("Your age: "))
print(f"Hello, {name}! Next year you turn {age + 1}.")`,
      },
    ],
  },
  {
    id: 'java', timeoutMs: 75000, file: 'Main.java', label: '☕ Java', compiler: 'openjdk-jdk-21+35',
    snippets: [
      {
        id: 'two-sum', name: '🎯 Two Sum',
        code: `// Two Sum — a HashMap answers "have I seen the number I need?"
import java.util.*;

class Main {
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>(); // value -> index
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                return new int[] { seen.get(need), i };
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9))); // [0, 1]
        System.out.println(Arrays.toString(twoSum(new int[] {3, 2, 4}, 6)));       // [1, 2]
    }
}`,
      },
    ],
  },
  {
    id: 'cpp', timeoutMs: 75000, file: 'main.cpp', label: '➕ C++', compiler: 'gcc-13.2.0',
    snippets: [
      {
        id: 'two-sum', name: '🎯 Two Sum',
        code: `// Two Sum — unordered_map gives O(1) "seen it?" lookups
#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int> nums, int target) {
    unordered_map<int, int> seen; // value -> index
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) return {seen[need], i};
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    auto ans = twoSum({2, 7, 11, 15}, 9);
    cout << ans[0] << " " << ans[1] << endl; // 0 1
    // TODO: print the second demo too — twoSum({3, 2, 4}, 6)
    return 0;
}`,
      },
    ],
  },
  {
    id: 'c', timeoutMs: 75000, file: 'main.c', label: '🔧 C', compiler: 'gcc-13.2.0-c',
    snippets: [
      {
        id: 'kadane', name: '📈 Max subarray (Kadane)',
        code: `// Kadane's algorithm: biggest sum of any contiguous subarray.
// Keep a running sum; the moment it hurts more than it helps, restart.
#include <stdio.h>

int main(void) {
    int a[] = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    int n = sizeof(a) / sizeof(a[0]);

    int best = a[0], run = a[0];
    for (int i = 1; i < n; i++) {
        run = run + a[i] > a[i] ? run + a[i] : a[i]; // extend or restart
        if (run > best) best = run;
        printf("i=%d a[i]=%d run=%d best=%d\\n", i, a[i], run, best);
    }
    printf("Answer: %d\\n", best); // 6 (the subarray 4, -1, 2, 1)
    return 0;
}`,
      },
    ],
  },
  {
    id: 'typescript', file: 'main.ts', label: '🔷 TypeScript', compiler: 'typescript-5.6.2',
    snippets: [
      {
        id: 'two-sum', name: '🎯 Two Sum (typed)',
        code: `// Two Sum, typed — every value carries a type, checked before it runs.
/// <reference lib="es2020" />
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need: number = target - nums[i];
    if (seen.has(need)) return [seen.get(need)!, i];
    seen.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));       // [1, 2]
// TODO: pass a string into the array — TypeScript refuses before running.`,
      },
    ],
  },
  {
    id: 'go', timeoutMs: 75000, file: 'main.go', label: '🐹 Go', compiler: 'go-1.23.2',
    snippets: [
      {
        id: 'two-sum', name: '🎯 Two Sum',
        code: `// Two Sum in Go — maps are built into the language.
package main

import "fmt"

func twoSum(nums []int, target int) []int {
	seen := map[int]int{} // value -> index
	for i, n := range nums {
		if j, ok := seen[target-n]; ok {
			return []int{j, i}
		}
		seen[n] = i
	}
	return []int{}
}

func main() {
	fmt.Println(twoSum([]int{2, 7, 11, 15}, 9)) // [0 1]
	fmt.Println(twoSum([]int{3, 2, 4}, 6))      // [1 2]
}`,
      },
    ],
  },
  {
    id: 'rust', timeoutMs: 90000, file: 'main.rs', label: '🦀 Rust', compiler: 'rust-1.82.0',
    snippets: [
      {
        id: 'two-sum', name: '🎯 Two Sum',
        code: `// Two Sum in Rust — a HashMap, explicit types, no garbage collector.
use std::collections::HashMap;

fn two_sum(nums: Vec<i32>, target: i32) -> Vec<usize> {
    let mut seen: HashMap<i32, usize> = HashMap::new(); // value -> index
    for (i, n) in nums.iter().enumerate() {
        if let Some(&j) = seen.get(&(target - n)) {
            return vec![j, i];
        }
        seen.insert(*n, i);
    }
    vec![]
}

fn main() {
    println!("{:?}", two_sum(vec![2, 7, 11, 15], 9)); // [0, 1]
    println!("{:?}", two_sum(vec![3, 2, 4], 6));      // [1, 2]
}`,
      },
    ],
  },
];

export const getOnlineLanguage = (id) => ONLINE_LANGUAGES.find((l) => l.id === id) || null;

// The exact JSON body POSTed to the provider. Pure — smoke-tested.
export function buildRequest(lang, source, stdin = '') {
  return {
    compiler: lang.compiler,
    code: String(source ?? ''),
    stdin: String(stdin ?? ''),
    save: false,
  };
}

// Run one program online. Resolves to a normalised result:
//   { stdout, stderr, code, signal, compileOutput }
// (compileOutput carries compiler errors for compiled languages.)
// Throws Error('network' | 'timeout' | 'rate-limit' | 'http-<status>')
// so the UI can show the right friendly message.
export async function executeOnline(lang, source, stdin = '', { timeoutMs, fetchImpl = fetch } = {}) {
  // Compiled languages get a longer ceiling: a cold rustc/javac run on
  // the free service can pass 45s even for a correct program. An
  // explicit timeoutMs (tests, UI) always wins.
  const limit = timeoutMs ?? lang.timeoutMs ?? 45000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), limit);
  let res;
  try {
    res = await fetchImpl(ONLINE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest(lang, source, stdin)),
      signal: ctrl.signal,
    });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('timeout');
    throw new Error('network');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429) throw new Error('rate-limit');
  if (!res.ok) throw new Error(`http-${res.status}`);
  const data = await res.json();
  const compileText = [data.compiler_error, data.compiler_message].filter(Boolean).join('\n').trim();
  const ran = data.program_output !== undefined || data.program_error !== undefined;
  return {
    stdout: data.program_output || '',
    stderr: data.program_error || '',
    code: data.status === undefined || data.status === '' ? null : Number(data.status),
    signal: data.signal || null,
    // If the program never ran, compiler text is the story; if it ran,
    // compiler text is at most warnings — the page shows it only when
    // there is no program output to explain the failure.
    compileOutput: ran && data.program_output ? '' : compileText,
  };
}

// Friendly, honest one-liners for the failure modes above.
export function onlineErrorMessage(err) {
  switch (err?.message) {
    case 'rate-limit':
      return 'The code runner is handling a lot of runs right now (rate limit). Wait a few seconds and press Run again.';
    case 'timeout':
      return 'The run took too long and was stopped. Check for an infinite loop — or code waiting for input that is not in the stdin box — then Run again.';
    case 'network':
      return 'Could not reach the online code runner. These languages run on the internet (JavaScript and SQL run inside your browser) — check your connection and press Run again.';
    default:
      return `The online code runner could not run that (${err?.message || 'unknown error'}). Give it a few seconds and press Run again.`;
  }
}
