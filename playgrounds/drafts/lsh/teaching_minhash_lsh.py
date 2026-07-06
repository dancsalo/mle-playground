#!/usr/bin/env python3
"""
Teaching-focused MinHash LSH Implementation
=============================================
A bare-bones, educational implementation using primitive numpy.
Uses CodeXGLUE BigCloneBench dataset for clone detection.

Run with: uv run python teaching_minhash_lsh.py
"""

import numpy as np
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich import box
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()

# =============================================================================
# STEP 1: K-SHINGLING (for code)
# =============================================================================

def k_shingle(text: str, k: int) -> set[str]:
    """
    Convert text into set of k-character shingles.
    For code, we keep whitespace to capture structure.
    """
    # Normalize whitespace but keep some structure
    text = text.lower()
    return set(text[i:i+k] for i in range(len(text) - k + 1))


def build_vocab(shingle_sets: list[set[str]]) -> list[str]:
    """Build vocabulary from all unique shingles across documents."""
    vocab = set()
    for shingles in shingle_sets:
        vocab.update(shingles)
    return sorted(vocab)


# =============================================================================
# STEP 2: ONE-HOT ENCODING
# =============================================================================

def one_hot_encode(shingles: set[str], vocab: list[str]) -> np.ndarray:
    """Convert shingle set to binary vector."""
    return np.array([1 if shingle in shingles else 0 for shingle in vocab], dtype=np.int8)


# =============================================================================
# STEP 3: MINHASHING
# =============================================================================

def generate_permutation(n: int, seed: int) -> np.ndarray:
    """Generate a random permutation of indices 0..n-1."""
    rng = np.random.default_rng(seed)
    perm = np.arange(n)
    rng.shuffle(perm)
    return perm


def minhash_signature(one_hot: np.ndarray, num_hashes: int, seed: int = 42) -> np.ndarray:
    """
    Compute MinHash signature from one-hot encoded vector.
    The clever insight: probability of picking same first '1' = Jaccard similarity!
    """
    signature = np.zeros(num_hashes, dtype=np.int32)
    n = len(one_hot)
    
    for h in range(num_hashes):
        perm = generate_permutation(n, seed + h * 7919)
        
        for idx in perm:
            if one_hot[idx] == 1:
                signature[h] = idx + 1
                break
        else:
            signature[h] = n + 1
    
    return signature


# =============================================================================
# STEP 4: BANDING
# =============================================================================

def split_into_bands(signature: np.ndarray, num_bands: int) -> list[np.ndarray]:
    """Split signature into bands."""
    r = len(signature) // num_bands
    bands = []
    for i in range(num_bands):
        start = i * r
        bands.append(signature[start:start + r])
    return bands


def hash_band(band: np.ndarray) -> str:
    """Simple hash function for a band."""
    return tuple(band.tolist())


# =============================================================================
# STEP 5: FINDING CANDIDATES
# =============================================================================

def find_candidates(signatures: list[np.ndarray], num_bands: int) -> list[tuple[int, int]]:
    """Find candidate similar pairs using banding."""
    all_bands = [split_into_bands(sig, num_bands) for sig in signatures]
    
    candidates = set()
    
    for band_idx in range(num_bands):
        buckets = {}
        
        for doc_idx, bands in enumerate(all_bands):
            band_hash = hash_band(bands[band_idx])
            if band_hash not in buckets:
                buckets[band_hash] = []
            buckets[band_hash].append(doc_idx)
        
        for bucket_docs in buckets.values():
            if len(bucket_docs) > 1:
                for i in range(len(bucket_docs)):
                    for j in range(i + 1, len(bucket_docs)):
                        candidates.add((bucket_docs[i], bucket_docs[j]))
    
    return sorted(candidates)


# =============================================================================
# STEP 6: SIMILARITY
# =============================================================================

def jaccard_similarity(set_a: set[str], set_b: set[str]) -> float:
    """True Jaccard similarity."""
    if not set_a and not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b) if (set_a | set_b) else 0.0


def signature_similarity(sig_a: np.ndarray, sig_b: np.ndarray) -> float:
    """MinHash signature similarity."""
    return np.mean(sig_a == sig_b)


# =============================================================================
# SYNTHETIC DATA FALLBACK
# =============================================================================

def generate_synthetic_code_samples():
    """Generate synthetic code samples for teaching when dataset unavailable."""
    
    # Base function - varying slightly for different versions
    base_funcs = [
        # Similar functions (high Jaccard - clones)
        '''public int add(int a, int b) {
    return a + b;
}''',
        '''public int add(int x, int y) {
    return x + y;
}''',
        '''public int calculateSum(int a, int b) {
    return a + b;
}''',
        
        # Medium similarity
        '''public int multiply(int a, int b) {
    return a * b;
}''',
        '''public int multiply(int x, int y) {
    return x * y;
}''',
        
        # Different functions (low Jaccard - non-clones)
        '''public void printHello() {
    System.out.println("Hello World");
}''',
        '''public String getMessage() {
    return "Hello World";
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
    ]
    
    # Add more variations
    synthetic = []
    for i, func in enumerate(base_funcs):
        synthetic.append((f"func_{i}", func))
        # Add slight variations
        if i < 5:
            var_func = func.replace("int ", "long ").replace("return ", "// return\n    return ")
            synthetic.append((f"func_{i}_var", var_func))
    
    console.print(f"[green]Generated {len(synthetic)} synthetic code snippets[/green]")
    return synthetic


# =============================================================================
# LOAD DATASET
# =============================================================================

def load_sample_data():
    """Load sample code pairs from CodeXGLUE BigCloneBench, or use synthetic if unavailable."""
    console.print("\n[bold cyan]Loading CodeXGLUE BigCloneBench dataset...[/bold cyan]")
    
    try:
        from datasets import load_dataset
    except ImportError:
        console.print("[yellow]Installing datasets library...[/yellow]")
        import subprocess
        import sys
        subprocess.run([sys.executable, "-m", "pip", "install", "datasets", "tqdm"], check=True)
        from datasets import load_dataset
    
    # Try to load the dataset, fall back to synthetic if it fails
    try:
        # Load with streaming to avoid downloading huge dataset
        ds = load_dataset(
            "google/code_x_glue_cc_clone_detection_big_clone_bench",
            streaming=True,
            split="train"
        )
        
        # Collect both clones and non-clones
        clones = []
        non_clones = []
        sample_size = 100
        
        for item in ds:
            if item['label'] == 1 and len(clones) < sample_size // 2:
                clones.append((item['id1'], item['func1'], True))
                clones.append((item['id2'], item['func2'], True))
            elif item['label'] == 0 and len(non_clones) < sample_size // 4:
                non_clones.append((item['id1'], item['func1'], False))
                non_clones.append((item['id2'], item['func2'], False))
            
            if len(clones) >= sample_size // 2 and len(non_clones) >= sample_size // 4:
                break
        
        # Combine and take unique code snippets
        all_code = {}
        for id_, code, is_clone in clones + non_clones:
            if id_ not in all_code:
                all_code[id_] = code
        
        codes = list(all_code.items())[:sample_size]
        console.print(f"[green]Loaded {len(codes)} unique code snippets from HuggingFace[/green]")
        console.print("   - Some are clones (label=1), some are not (label=0)")
        
        return codes
        
    except Exception as e:
        console.print(f"[yellow]Could not load dataset from HuggingFace: {e}[/yellow]")
        console.print("[yellow]Falling back to synthetic code examples...[/yellow]")
        return generate_synthetic_code_samples()


# =============================================================================
# MAIN VISUALIZATION
# =============================================================================

def main():
    console.print(Panel.fit(
        Text("🎓 MINHASH LSH - CODE CLONE DETECTION", justify="center", style="bold blue"),
        border_style="blue"
    ))
    console.print("[italic]Dataset: CodeXGLUE BigCloneBench (Java methods)[/italic]\n")
    
    # Load sample data
    codes = load_sample_data()
    
    # Parameters - keep small for teaching clarity
    K = 5  # Shingle size for code
    SIGNATURE_LENGTH = 20
    NUM_BANDS = 5
    ROWS_PER_BAND = SIGNATURE_LENGTH // NUM_BANDS
    
    console.print(f"\n[bold]Parameters:[/bold] k={K}, signature_length={SIGNATURE_LENGTH}, bands={NUM_BANDS}, rows_per_band={ROWS_PER_BAND}")
    
    # Get short identifiers for display
    short_codes = [(f"code_{i}", code[:200] + "..." if len(code) > 200 else code) for i, (id_, code) in enumerate(codes)]
    
    # -------------------------------------------------------------------------
    # STEP 1: Shingling
    # -------------------------------------------------------------------------
    console.print("\n[bold cyan]Step 1: K-Shingling (k={})[/bold cyan]".format(K))
    console.print("=" * 50)
    
    shingles = [k_shingle(code, K) for _, code in short_codes]
    
    table = Table(box=box.SIMPLE)
    table.add_column("Code", style="cyan")
    table.add_column("# Shingles", style="yellow")
    table.add_column("Sample Shingles", style="white")
    
    for i, (name, _) in enumerate(short_codes[:8]):
        sample = sorted(list(shingles[i]))[:5]
        table.add_row(name, str(len(shingles[i])), str(sample))
    
    console.print(table)
    if len(short_codes) > 8:
        console.print(f"[italic]... and {len(short_codes) - 8} more code snippets[/italic]")
    
    # -------------------------------------------------------------------------
    # STEP 2: Build Vocab & One-Hot
    # -------------------------------------------------------------------------
    console.print("\n[bold cyan]Step 2: Vocabulary & One-Hot Encoding[/bold cyan]")
    console.print("=" * 50)
    
    vocab = build_vocab(shingles)
    console.print(f"Vocabulary size: {len(vocab)} unique shingles")
    
    one_hots = [one_hot_encode(sh, vocab) for sh in shingles]
    
    table = Table(box=box.SIMPLE)
    table.add_column("Code", style="cyan")
    table.add_column("Vector Size", style="yellow")
    table.add_column("Density", style="green")
    
    for i, (name, _) in enumerate(short_codes[:6]):
        density = np.mean(one_hots[i]) * 100
        table.add_row(name, str(len(vocab)), f"{density:.2f}%")
    
    console.print(table)
    
    # -------------------------------------------------------------------------
    # STEP 3: MinHash Signatures
    # -------------------------------------------------------------------------
    console.print("\n[bold cyan]Step 3: MinHash Signatures[/bold cyan]")
    console.print("=" * 50)
    console.print("[italic]Computing signatures - this may take a moment...[/italic]")
    
    signatures = [minhash_signature(oh, SIGNATURE_LENGTH) for oh in one_hots]
    
    table = Table(box=box.SIMPLE)
    table.add_column("Code", style="cyan")
    table.add_column("Signature (first 10)", style="white")
    
    for i, (name, _) in enumerate(short_codes[:6]):
        table.add_row(name, str(signatures[i][:10]) + "...")
    
    console.print(table)
    
    # -------------------------------------------------------------------------
    # STEP 4: Banding
    # -------------------------------------------------------------------------
    console.print("\n[bold cyan]Step 4: Banding ({} bands)[/bold cyan]".format(NUM_BANDS))
    console.print("=" * 50)
    
    all_bands = [split_into_bands(sig, NUM_BANDS) for sig in signatures]
    
    # Show first band as example
    console.print(f"\n[yellow]Example - Band 0 (rows 1-{ROWS_PER_BAND}):[/yellow]")
    
    table = Table(box=box.SIMPLE)
    table.add_column("Code", style="cyan")
    table.add_column("Band 0 Values", style="white")
    table.add_column("Hash", style="magenta")
    
    for i, (name, _) in enumerate(short_codes[:6]):
        band = all_bands[i][0]
        table.add_row(name, str(band), str(hash_band(band)))
    
    console.print(table)
    
    # -------------------------------------------------------------------------
    # STEP 5: Candidates
    # -------------------------------------------------------------------------
    console.print("\n[bold cyan]Step 5: Finding Candidate Pairs[/bold cyan]")
    console.print("=" * 50)
    
    candidates = find_candidates(signatures, NUM_BANDS)
    
    console.print(f"[bold]Found {len(candidates)} candidate pairs![/bold]")
    
    if candidates:
        # Show first few candidates with similarities
        table = Table(box=box.SIMPLE)
        table.add_column("Pair", style="cyan")
        table.add_column("True Jaccard", style="yellow")
        table.add_column("MinHash Sim", style="green")
        table.add_column("Is Clone?", style="magenta")
        
        for doc_a, doc_b in candidates[:10]:
            true_jaccard = jaccard_similarity(shingles[doc_a], shingles[doc_b])
            sig_sim = signature_similarity(signatures[doc_a], signatures[doc_b])
            pair_name = f"{short_codes[doc_a][0]}-{short_codes[doc_b][0]}"
            
            # We don't have ground truth here, but we can show similarity
            is_clone = "✓ Likely" if sig_sim > 0.3 else "?"
            
            table.add_row(pair_name, f"{true_jaccard:.3f}", f"{sig_sim:.3f}", is_clone)
        
        console.print(table)
        
        if len(candidates) > 10:
            console.print(f"[italic]... and {len(candidates) - 10} more candidate pairs[/italic]")
    
    # -------------------------------------------------------------------------
    # S-Curve
    # -------------------------------------------------------------------------
    console.print("\n[bold cyan]S-Curve Analysis[/bold cyan]")
    console.print("=" * 50)
    console.print(f"[italic]P(candidate) = 1 - (1 - s^{ROWS_PER_BAND})^{NUM_BANDS}[/italic]\n")
    
    table = Table(box=box.SIMPLE)
    table.add_column("Similarity s", style="cyan")
    table.add_column("P(candidate)", style="yellow")
    table.add_column("Probability Bar", style="white")
    
    for s in [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]:
        p = 1 - (1 - s ** ROWS_PER_BAND) ** NUM_BANDS
        bar = "█" * int(p * 30)
        table.add_row(f"{s:.1f}", f"{p:.4f}", bar)
    
    console.print(table)
    
    console.print("\n[bold green]✓ Teaching implementation complete![/bold green]")
    console.print(f"[italic]Processed {len(codes)} code snippets and found {len(candidates)} candidate clone pairs.[/italic]")


if __name__ == "__main__":
    main()