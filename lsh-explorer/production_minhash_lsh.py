#!/usr/bin/env python3
"""
Production-Ready MinHash LSH for Code Clone Detection
======================================================
Uses datasketch library for efficient, scalable implementation.
Uses CodeXGLUE BigCloneBench dataset (with synthetic fallback).

Run with: uv run python production_minhash_lsh.py
"""

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich import box

console = Console()

# =============================================================================
# INSTALL DEPENDENCIES
# =============================================================================

def ensure_dependencies():
    """Install required packages if needed."""
    import subprocess
    import sys
    
    required = ["datasets", "datasketch", "tqdm"]
    for pkg in required:
        try:
            __import__(pkg.replace("-", "_"))
        except ImportError:
            console.print(f"[yellow]Installing {pkg}...[/yellow]")
            subprocess.run([sys.executable, "-m", "pip", "install", pkg], check=True)

ensure_dependencies()

# =============================================================================
# IMPORT DEPENDENCIES
# =============================================================================

import numpy as np
from datasets import load_dataset
from datasketch import MinHash, MinHashLSH
from tqdm import tqdm
import random


# =============================================================================
# LOAD DATASET
# =============================================================================

def load_clone_detection_data(sample_size: int = 1000):
    """
    Load code clone detection dataset from Hugging Face, or use synthetic if unavailable.
    """
    console.print("\n[bold cyan]📂 Loading CodeXGLUE BigCloneBench dataset...[/bold cyan]")
    
    try:
        ds = load_dataset(
            "google/code_x_glue_cc_clone_detection_big_clone_bench",
            streaming=True,
            split="train"
        )
        
        seen_ids = set()
        samples = []
        
        for item in tqdm(ds, desc="Loading", total=sample_size * 3):
            for func_key in ['func1', 'func2']:
                func = item[func_key]
                if func and len(func) > 50:
                    func_id = f"{item['id']}_{func_key}"
                    if func_id not in seen_ids:
                        seen_ids.add(func_id)
                        samples.append({
                            'id': func_id,
                            'code': func,
                            'label': item['label']
                        })
            
            if len(samples) >= sample_size:
                break
        
        console.print(f"[green]✓ Loaded {len(samples)} code snippets[/green]")
        clones = sum(1 for s in samples if s['label'] == 1)
        non_clones = sum(1 for s in samples if s['label'] == 0)
        console.print(f"   - Clones: {clones}, Non-clones: {non_clones}")
        
        return samples
        
    except Exception as e:
        console.print(f"[yellow]Could not load dataset: {e}[/yellow]")
        console.print("[yellow]Falling back to synthetic data...[/yellow]")
        return generate_synthetic_samples(sample_size)


def generate_synthetic_samples(sample_size: int = 1000):
    """Generate synthetic code samples for testing."""
    
    templates = [
        '''public int add(int a, int b) {
    return a + b;
}''',
        '''public int multiply(int a, int b) {
    return a * b;
}''',
        '''public void printHello() {
    System.out.println("Hello");
}''',
        '''private boolean isEmpty(String s) {
    return s.length() == 0;
}''',
        '''public List<Integer> sortList(List<Integer> list) {
    Collections.sort(list);
    return list;
}''',
        '''public int findMax(int[] arr) {
    int max = arr[0];
    for (int i = 1; i < arr.length; i++) {
        if (arr[i] > max) max = arr[i];
    }
    return max;
}''',
        '''public String reverse(String s) {
    return new StringBuilder(s).reverse().toString();
}''',
        '''public int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}''',
    ]
    
    samples = []
    random.seed(42)
    
    for i in range(sample_size):
        template = templates[i % len(templates)]
        if i % 3 == 0:
            template = template.replace("int ", "long ")
        elif i % 3 == 1:
            template = template.replace("public ", "private ")
        
        samples.append({
            'id': f'synthetic_{i}',
            'code': template,
            'label': 1 if i % 2 == 0 else 0
        })
    
    console.print(f"[green]✓ Generated {len(samples)} synthetic code snippets[/green]")
    return samples


# =============================================================================
# CREATE MINHASH SIGNATURES
# =============================================================================

def create_minhash(code: str, num_perm: int = 128, k: int = 5) -> MinHash:
    """Create MinHash signature for code snippet."""
    code_lower = code.lower()
    tokens = [code_lower[i:i+k] for i in range(len(code_lower) - k + 1)]
    
    m = MinHash(num_perm=num_perm)
    for token in tokens:
        m.update(token.encode('utf-8'))
    
    return m


def create_lsh_index(samples: list, num_perm: int = 128, k: int = 5, threshold: float = 0.5):
    """Create LSH index for all samples."""
    console.print(f"\n[bold cyan]🔧 Creating LSH index...[/bold cyan]")
    console.print(f"   Parameters: num_perm={num_perm}, k={k}, threshold={threshold}")
    
    lsh = MinHashLSH(threshold=threshold, num_perm=num_perm)
    minhashes = {}
    
    for sample in tqdm(samples, desc="Creating signatures"):
        m = create_minhash(sample['code'], num_perm=num_perm, k=k)
        minhashes[sample['id']] = m
        lsh.insert(sample['id'], m)
    
    console.print(f"[green]✓ Indexed {len(minhashes)} documents[/green]")
    
    return lsh, minhashes


# =============================================================================
# QUERY SIMILARITY
# =============================================================================

def find_similar(lsh, minhashes, sample_id: str, top_k: int = 10):
    """Find similar documents for a given sample."""
    query_minhash = minhashes[sample_id]
    results = lsh.query(query_minhash)
    results = [r for r in results if r != sample_id]
    return results[:top_k]


def compute_similarity(m1: MinHash, m2: MinHash) -> float:
    """Compute Jaccard similarity from MinHash."""
    return m1.jaccard(m2)


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    console.print(Panel.fit(
        Text("🚀 PRODUCTION MINHASH LSH - CODE CLONE DETECTION", justify="center", style="bold green"),
        border_style="green"
    ))
    console.print("[italic]Dataset: CodeXGLUE BigCloneBench | Library: datasketch[/italic]\n")
    
    # Load data
    SAMPLE_SIZE = 500
    samples = load_clone_detection_data(sample_size=SAMPLE_SIZE)
    
    # Show sample code
    console.print("\n[bold cyan]Sample Code Snippet:[/bold cyan]")
    console.print("-" * 50)
    sample_code = samples[0]['code'][:500]
    console.print(f"[dim]{sample_code}...[/dim]")
    
    # Parameters
    K = 5
    NUM_PERM = 128
    THRESHOLD = 0.5
    
    console.print(f"\n[bold]Configuration:[/bold]")
    console.print(f"   k (shingle size): {K}")
    console.print(f"   num_perm (signature length): {NUM_PERM}")
    console.print(f"   threshold: {THRESHOLD}")
    
    # Create index
    lsh, minhashes = create_lsh_index(samples, num_perm=NUM_PERM, k=K, threshold=THRESHOLD)
    
    # Query examples
    console.print("\n[bold cyan]🔍 Querying for Similar Code[/bold cyan]")
    console.print("=" * 50)
    
    query_indices = [0, 10, 50, 100]
    all_results = []
    
    for idx in query_indices:
        sample = samples[idx]
        query_id = sample['id']
        
        similar_ids = find_similar(lsh, minhashes, query_id, top_k=5)
        
        if similar_ids:
            console.print(f"\n[yellow]Query:[/yellow] {query_id}")
            console.print(f"[yellow]Code (first 100 chars):[/yellow] {sample['code'][:100]}...")
            
            table = Table(box=box.SIMPLE)
            table.add_column("Similar To", style="cyan")
            table.add_column("Jaccard Sim", style="yellow")
            
            for sim_id in similar_ids:
                sim_m1 = minhashes[query_id]
                sim_m2 = minhashes[sim_id]
                sim = compute_similarity(sim_m1, sim_m2)
                
                table.add_row(f"{sim_id[:30]}...", f"{sim:.4f}")
                all_results.append((query_id, sim_id, sim))
            
            console.print(table)
        else:
            console.print(f"\n[yellow]Query:[/yellow] {query_id}")
            console.print("[dim]No similar documents found above threshold[/dim]")
    
    # Statistics
    console.print("\n[bold cyan]📊 Statistics[/bold cyan]")
    console.print("=" * 50)
    
    total_queries = len(query_indices)
    avg_results = len(all_results) / total_queries if total_queries > 0 else 0
    
    console.print(f"Total documents indexed: {len(samples)}")
    console.print(f"Total queries performed: {total_queries}")
    console.print(f"Average results per query: {avg_results:.1f}")
    
    if all_results:
        similarities = [r[2] for r in all_results]
        console.print(f"Min similarity found: {min(similarities):.4f}")
        console.print(f"Max similarity found: {max(similarities):.4f}")
        console.print(f"Avg similarity found: {np.mean(similarities):.4f}")
    
    # Performance notes
    console.print("\n[bold cyan]⚡ Performance Characteristics[/bold cyan]")
    console.print("=" * 50)
    
    console.print("""
This implementation uses datasketch's MinHashLSH which provides:

• O(n) space complexity for storing signatures
• O(n) time complexity for indexing  
• O(k) average query time where k = number of candidate buckets

The LSH approach with threshold=0.5 means:
• Documents with Jaccard similarity ≥ 0.5 are likely to match
• Documents with similarity < 0.5 are unlikely to match

For production use, consider:
• Increasing num_perm for higher accuracy (trade-off: more memory)
• Tuning threshold based on your use case
• Using MinHashLSHEnsemble for even better recall
""")
    
    console.print("\n[bold green]✓ Production implementation complete![/bold green]")
    console.print(f"[italic]Processed {len(samples)} code snippets from BigCloneBench[/italic]")


if __name__ == "__main__":
    main()