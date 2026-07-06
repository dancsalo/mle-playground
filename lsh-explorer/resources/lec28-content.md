CS 388R: Randomized Algorithms, Fall 2019
December 5th, 2019
Lecture 28: Locality Sensitive Hashing
Prof. Eric Price
Scribe: Joshua Cook
NOTE: THESE NOTES HAVE NOT BEEN EDITED OR CHECKED FOR CORRECTNESS
1
Overview
In previous lectures we discussed hash functions and how they can be used in hash functions. We
discussed how we can use n-wise independence to eﬃciently run hashing algorithms through speciﬁc
eﬃciently computable and representable hash families.
In this lecture we discuss locality sensitive hashing for computing approximate nearest neighbors.
Locality sensitive hashing is another way to use hashing. It uses hashing for high dimensional
computational geometry.
In particular, we use it solve an approximate version of the nearest
neighbors problem.
1.1
Nearest neighbors problem
The nearest neighbors problem takes n points, and for another point tries to give the closest point
in the n original points. Speciﬁcally, we want to construct a data structure to answer ”nearest
neighbor” queries fast, but approximately.
So let our set of points be Y = {p1, ..., pn} ⊆X (think of X = Rd, d >> 1). We want to construct
a data structure so that given a query to some point p in X, ﬁnd i such that ∥p −pi∥is minimized.
But actually getting the min is tricky, so we relax to:
If mini ∥p −pi∥= r, we ﬁnd j such that ∥p −pj∥≤cr for some approximation factor c.
This is the nearest neighbor problem, but locality sensitive hashing is best at solving ’near’ neighbor
queries.
1.2
”Near” neighbors
Near neighbor queries are like nearest neighbor, except we are told the radius r at the beginning.
That is r such that mini ∥p −pi∥≤r ﬁnd some j ∈[n] such that ∥p −pj∥≤cr for constant factor
c. More generally, an r-near query with constant factor c will return a j such that ∥p −pj∥≤cr if
there is some i so that mini ∥p −pi∥≤r.
We can use r-near queries to solve nearest neighbor by checking with r = 1, 2, 4, 8, ..., R.
We only need to give output if there is a point within r, even if something is within cr. But it may
always output any point within cr, whether there are points within r or not.
1
We only consider points that are binary strings X = {0, 1}d with hamming distance metric. For
other metrics there are slightly diﬀerent approaches, but general methods apply for other spaces
and other metrics.
2
Diﬀerent Algorithm Runtimes
We are trying to optimize:
1. Time per query
2. Space to store data structure.
We are ignoring the initialization overhead, though it is usually very close to the space requirements.
Then the run time of a few algorithms are:
Algorithm
Time
Space
Naive Exhaustive search
nd
nd
JL Exhaustive search
d + n log(n)
ϵ2
n log(n)
ϵ2
Precompute Answers
d
2d log(n)
JL Precompute
d
n1/ϵ2 log(n)
LSH
dnρ
n1+ρ
LSH (Hamming)
d + n1/c(k + dn1−c)
n1+1/c
Naive algorithm: Store everything in a list and search with exhaustive search. Takes nd space
and nd lookup time.
If d is very large, we can approximate using a smaller space with John-
son–Lindenstrauss (JL) dimensionality reduction. Then space becomes n log(n)
ϵ2
. Time per query is
just d time for embedding plus n
ϵ2 log(n) for comparison.
Precompute: we can precompute every answer and store it in 2d log(n) space and then get d time
lookup. This is good if d = log(n). Otherwise we can again use JL again to get a d time lookup
with polynomial space in n (but exponential space in ϵ!).
Locality Sensitive Hashing (LSH) gives another trade oﬀ. Gives lookup time nρ and space n1+ρ
for ρ = 1
c. These notes are all for hamming or L1 distance, but for L2 can get down to ρ =
1
c2 .
Thus we will use ρ instead of 1
c. Similarly there is an even tighter bound for the L2 norm than the
speciﬁc hamming bound given above.
3
Algorithm Outline
What we would like is that nearby points tend to hash to the same bucket, and distant hashes tend
to hash to diﬀerent buckets. That is h : X →U where U are the cells of our hash table. When we
look at P[h(x) = h(y)], we want it to decrease as ∥x −y∥increases.
Speciﬁcally, we want a p1 and p2 so that:
2
∀x, y : ∥x −y∥≤r =⇒P[h(x) = h(y)] ≥p1
∥x −y∥≥cr =⇒P[h(x) = h(y)] ≤p2
If we have this, then we will get LSH with parameter ρ = log(1/p1)/ log(1/p2). This will end up
being the ρ in LSH above and improves as p1 increases and p2 decreases.
3.1
Intuition on Technique Limits
For rest of the notes, we will construct locality sensitive hashing, but ﬁrst we will look at the limits
of this method.
Let us analyze points that are just in a line all separated by distance r. Lets call then x, z1, ..., zc−1, y.
Then the probability h(x) = h(y) which is at most p2 is bounded below by the probability all the
z hash to the same thing. Since we are only looking for intuition, let us assume all these collisions
are independent (even though we know this is probably wrong). Then we see that:
p2 ≥P[h(x) = h(y)]
≥P[h(x) = h(z1) = h(z2) = ...h(zc−1) = h(y)]
∼P[h(x) = h(z1)·] P[h(z1) = h(z2)] · ... · P[h(zc−1) = h(y)]
≥p1 · p1 · ... · p1
=pc
1
So we don’t expect to get p2 ≥pc
1. Now, this is NOT a proof that such a bound is optimal, but
such a bound is a reasonable goal. Indeed, as stated above, there are improvements that can be
made over this in the L2 space. But this is indeed what we get for hamming distance of strings.
4
Algorithim
4.1
Constructing the Locality Sensitive Hash
To construct our locality sensitive hash, we ﬁrst make a locality sensitive hash with an appropriate
ρ. Then we repeat to decrease p2 and get the false positive rate small.
1. Let h output one coordinate of its input: i. That is, for some random i, h(x) = xi. Then
P[h(x) = h(y)] = 1 −∥x−y∥
d
. Thus p1 = 1 −r
d and p2 = 1 −cr
d . Then
ρ = log(1/p1)/ log(1/p2) ≃1
c
This comes from log(1 −ϵ) ≃−ϵ + O(ϵ2), or from log(1/p1)/ log(1/p2) =
1
logp1(p2).
3
2. Now we want to get p1 = 1
n and p2 ≤
1
nc . Let
g(x) = (h1(x), h2(x), ..., hk(x)) for independent h from step 1
Now we are choosing k random coordinates of x and using that as our hash function. Then
P[g(x) = g(y)] =

1 −∥x −y∥
d
k
Then p1,g = pk
1,h and p2,g = pk
2,h. Now we want to set k so that p1,g = 1
n, so set k =
log(n)
−log(1−r/d).
Then
p1,g =pk
1,h
p2,g =pk
1,h
=(1 −r
d)
log(n)
−log(1−r/d)
=(1 −cr
d )
log(n)
−log(1−r/d)
=(1 −r
d)−log1−r/d(n)
≤(1 −r
d)−c log1−r/d(n)
= 1
n
= 1
nc
4.2
Solving Near Neighbors with LSH
Now we take this small false positive rate from above and look for hash collisions. This will give
false positives much more rarely than it gives true positives. Then we will repeat many times so
that we give true positives very often but false negatives still rarely.
1. LSH uses g as a hash function, which outputs to {0, 1}k. We store each point into a hash
table using g. We will later lookup close points using this hash, hoping that the hash stores
them together. Using a linked list hash table, this will use 2k + n = O(n) space to store the
hash table.
To query q, we will hash q and look through the linked list until we ﬁnd some pi within
distance cr to q. The time this will take is the amount of time to hash plus the amount of
time it takes to compare distances times the number of collisions of far points in this bucket
plus one if something within cr is in this bucket.
The expected time to hash is just k, the number of expected collisions is at most
n
nc and a
length comparison takes time d. So the expected time is k +
d
nc−1 if there are no matches and
d larger if there are. We can pessimistically bound this by O(d).
We fail if every point within r does not collide, which if there is a point close, is chance at
most 1 −p1 = 1 −1/nρ. So we have space O(n) with success probability
1
nρ .
2. To get the LSH parameters above, we repeat nρ times to get constant factor probability of
success. Can do log(n) more to get high probability. Then the space is just n1+ρ and time
dnρ.
If we analyze a tiny bit closer, we actually see that lookup time from step 1 was only O(d)
if we ﬁnd a match. Otherwise it is expected to be much smaller. Further, a match will only
happen once and then we will immediately return. Thus if we analyze closely, we can ﬁnd a
slightly better expected lookup time of O(d + nρk + dnρ+1−c).
4
4.3
LSH Recap
So LSH just starts with a naive hash function with good ρ, but high false positive. Then we apply
many of these to get a very small false positive rate, and a larger but still small true positive rate.
Then we try looking up with this new hash function to ﬁnd a near neighbor with a small positive
rate, but a much smaller false positive rate. To make ﬁnding a match likely, repeat this hash lookup
with many diﬀerent hashes. If there is a good answer, this algorithm will ﬁnd an okay answer. In
particular this algorithm works well if ρ is signiﬁcantly less than 1.
5
