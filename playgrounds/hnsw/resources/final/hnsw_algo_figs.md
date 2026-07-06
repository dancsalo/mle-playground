6 
IEEE TRANSACTIONS ON JOURNAL NAME,  MANUSCRIPT ID 
 
very short greedy algorithm paths [28]. Surprisingly, in-
creasing the mL from zero leads to a measurable increase 
in speed on very high dimensional data (100k dense ran-
dom d=1024 vectors, see plot in Fig. 4), and does not in-
troduce any penalty for the Hierarchical NSW approach. 
For real data such as SIFT vectors [1] (which have com-
plex mixed structure), the performance improvement by 
increasing the mL is higher, but less prominent at current 
settings compared to improvement from the heuristic (see 
Fig. 5 for 1-NN search performance on 5 million 128-
dimensional SIFT vectors from the learning set of BIG-
ANN [13]).  
Selection of the Mmax0 (the maximum number of con-
nections that an element can have in the zero layer) also 
has a strong influence on the search performance, espe-
cially in case of high quality (high recall) search. Simula-
tions show that setting Mmax0 to M (this corresponds to k-
NN graphs on each layer if the neighbors selection heuris-
tic is not used) leads to a very strong performance penalty 
at high recall. Simulations also suggest that 2∙M is a good 
choice for Mmax0: setting the parameter higher leads to 
performance degradation and excessive memory usage. 
In Fig. 6 there are presented results of search performance 
for the 5M SIFT learn dataset depending on the Mmax0 pa-
rameter (done on an Intel Core i5 2400 CPU). The sug-
gested value gives performance close to optimal at differ-
ent recalls. 
In all of the considered cases, use of the heuristic for 
proximity graph neighbors selection (alg. 4) leads to a 
higher or similar search performance compared to the 
naïve connection to the nearest neighbors (alg. 3). The 
effect is the most prominent for low dimensional data, at 
high recall for mid-dimensional data and for the case of 
highly clustered data (ideologically discontinuity can be 
regarded as a local low dimensional feature), see the 
comparison in Fig. 7 (Core i5 2400 CPU). When using the 
closest neighbors as connections for the proximity graph, 
the Hierarchical NSW algorithm fails to achieve a high 
recall for clustered data because the search stucks at the 
clusters boundaries. Contrary, when the heuristic is used 
(together with candidates’ extension, line 3 in Alg. 4), 
clustering leads to even higher performance. For uniform 
and very high dimensional data there is a little difference 
between the neighbors selecting methods (see Fig. 4), pos-
sibly due to the fact that in this case almost all of the 
nearest neighbors are selected by the heuristic. 
The only meaningful construction parameter left for 
the user is M. A reasonable range of M is from 5 to 48. 
Simulations show that smaller M generally produces bet-
ter results for lower recalls and/or lower dimensional 
data, while bigger M is better for high recall and/or high 
dimensional data (see Fig. 8 for illustration, Core i5 2400 
CPU). The parameter also defines the memory consump-
tion of the algorithm (which is proportional to M), so it 
should be selected with care. 
Selection of the efConstruction parameter is straight-
forward. As it was suggested in [26] it has to be large 
enough to produce K-ANNS recall close to unity during 
the construction process (0.95 is enough for the most use-
cases). And just like in [26], this parameter can possibly 
0,0
0,5
1,0
1,5
2,0
0,01
0,02
0,03
0,04
Query time, ms
mL
10M d=4 random vectors,
M=6, Mmax0=12
Recall 0.9, 1-NN
 Simple neighbors
 Heuristic
Autoselect
 
0,0
0,5
1,0
1,5
2,0
14,1
14,2
14,3
14,4
14,5
Query time, ms
mL
100k random vectors, d=1024
M=20, Mmax0=40,
Recall=0.9, 1-NN
 Simple neighbors
 Heuristic
Autoselect
 
0,0
0,5
1,0
1,5
2,0
0,09
0,10
0,11
0,12
0,13
0,14
0,15
Query time, ms
mL
5M SIFT, d=128,
M=16, Mmax0=32,
Recall=0.9, 1-NN
 Simple Neighbors
 Heuristic
Autoselect
Fig. 3. Plots for query time vs mL parameter 
for 10M random vectors with d=4. The au-
toselected value 1/ln(M) for mL is shown by 
an arrow. 
Fig. 4. Plots for query time vs mL parame-
ter for 100k random vectors with d=1024. 
The autoselected value 1/ln(M) for mL is 
shown by an arrow. 
Fig. 5. Plots for query time vs mL parameter 
for 5M SIFT learn dataset. The autoselected 
value 1/ln(M) for mL is shown by an arrow. 
0
20
40
60
80
100
120
140
160
180
200
0.1
1
Query time, ms
Mmax0
5M SIFT, d=128, M=20,
mL=0.33, 10-NN
 Recall=0.4
 Recall=0.8
 Recall=0.94
Autoselect
 
0,2
0,4
0,6
0,8
1,0
0,01
0,1
Query time, ms
Recall
10M random vectors, d=10 
M=16, 10-NN
 baseline - no clusters
 heuristic - no clusters
 baseline - 100 clusters
 heuristic - 100 clusters
10
-3
10
-2
10
-1
10
0
0,01
0,1
1
Query time, ms
Recall error (1-recall)
5M SIFT, d=128,
10-NN
 M=2
 M=3
 M=6
 M=12
 M=20
 M=40
 
Fig. 6. Plots for query time vs Mmax0 pa-
rameter for 5M SIFT learn dataset. The 
autoselected value 2∙M for Mmax0 is shown 
by an arrow. 
Fig. 7. Effect of the method of neighbor 
selections (baseline corresponds to alg. 3, 
heuristic to alg. 4) on clustered (100 ran-
dom isolated clusters) and non-clustered 
d=10 random vector data. 
Fig. 8. Plots for recall error vs query time 
for different parameters of M for Hierar-
chical NSW on 5M SIFT learn dataset. 

--- Page break ---
AUTHOR ET AL.:  TITLE 
7 
 
be auto-configured by using sample data. 
The construction process can be easily and efficiently 
parallelized with only few synchronization points (as 
demonstrated in Fig. 9) and no measurable effect on index 
quality. Construction speed/index quality tradeoff is con-
trolled via the efConstruction parameter. The tradeoff 
between the search time and the index construction time 
is presented in Fig. 10 for a 10M SIFT dataset and shows 
that a reasonable quality index can be constructed for 
efConstruction=100 on a 4X 2.4 GHz 10-core Xeon E5-
4650 v2 CPU server in just 3 minutes. Further increase of 
the efConstruction leads to little extra performance but in 
exchange of significantly longer construction time.  
 
4.2 Complexity analysis 
4.2.1 Search complexity 
The complexity scaling of a single search can be strictly 
analyzed under the assumption that we build exact De-
launay graphs instead of the approximate ones. Suppose 
we have found the closest element on some layer (this is 
guaranteed by having the Delaunay graph) and then de-
scended to the next layer. One can show that the average 
number of steps before we find the closest element in the 
layer is bounded by a constant.  
Indeed, the layers are not correlated with the spatial 
positions of the data elements and, thus, when we trav-
erse the graph there is a fixed probability p=exp(-mL) that 
the next node belongs to the upper layer. However, the 
search on the layer always terminates before it reaches the 
element which belongs to the higher layer (otherwise the 
search on the upper layer would have stopped on a dif-
ferent element), so the probability of not reaching the tar-
get on s-th step is bounded by exp(-s· mL). Thus the ex-
pected number of steps in a layer is bounded by a sum of 
geometric progression S =1/(1-exp(-mL)), which is inde-
pendent of the dataset size. 
If we assume that the average degree of a node in the 
Delaunay graph is capped by a constant C in the limit of 
the large dataset (this is the case for random Euclid da-
ta [48], but can be in principle violated in exotic spaces), 
then the overall average number of distance evaluations 
in a layer is bounded by a constant C· S, independently of 
the dataset size.  
And since the expectation of the maximum layer index 
by the construction scales as O(log(N)), the overall com-
plexity scaling is O(log(N)), in agreement with the simu-
lations on low dimensional datasets.  
The inital assumption of having the exact Delaunay 
graph violates in Hierarchical NSW due to usage of ap-
proximate edge selection heuristic with a fixed number of 
neighbors per element. Thus, to avoid stucking into a lo-
cal minimum the greedy search algorithm employs a 
backtracking procedure on the zero layer. Simulations 
show that at least for low dimensional data (Fig. 11, d=4) 
the dependence of the required ef parameter (which de-
termines the complexity via the minimal number of hops 
during the backtracking) to get a fixed recall saturates 
with the rise of the dataset size. The backtracking com-
plexity is an additive term in respect to the final complex-
ity, thus, as follows from the empirical data, inaccuracies 
of the Delaunay graph approximation do not alter the 
scaling.  
Such empirical investigation of the Delaunay graph 
approximation resilience requires having the average 
number of Delaunay graph edges independent of the da-
taset to evidence how well the edges are approximated 
with a constant number of connections in Hierarchical 
NSW. However, the average degree of Delaunay graph 
scales exponentially with the dimensionality [39]), thus 
for high dimensional data (e.g. d=128) the aforemen-
tioned condition requires having extremely large da-
tasets, making such empricial investigation unfeasible. 
Further analitical evidence is required to confirm whether 
the resilience of Delaunay graph aproximations general-
izes to higher dimensional spaces.  
4.2.2 Construction complexity 
The construction is done by iterative insertions of all ele-
ments, while the insertion of an element is merely a se-
quence of K-ANN-searches at different layers with a sub-
sequent use of heuristic (which has fixed complexity at 
fixed efConstruction). The average number of layers for 
an element to be added in is a constant that depends on 
mL: 
 




1
ln(
(0,1))
1
1
L
L
E l
E
unif
m
m




  
(1) 
Thus, the insertion complexiy scaling is the same as the 
one for the search, meaning that at least for relatively low 
dimensional datasets the construction time scales as 
O(N∙log(N)). 
0
5
10
15
20
25
30
35
40
0
10
20
30
40
50
60
70
80
90
Build time, minutes
Thread count
10M SIFT, d=128, M=16, 
efConstruction=100
 4X Xeon E5-4650 v2 (4x10 cores)
 Core i7-6850K (6 cores+HT)
 
0
2
4
6
8
10
12
0.2
0.3
0.4
0.5
0.6
0.7
Query time, ms
Build time, minutes
10M SIFT, d=128, M=16,
Recall 0.9, 1-NN
 
10
0
10
1
10
2
10
3
10
4
10
5
10
6
10
7
10
8
10
9
0
2
4
6
8
10
12
Average ef to reach target recall
Dataset size
Random vectors, d=4
M=6, Mmax0=12, 1-NN
 Recall=0.9
 Recall=0.99
 Recall=0.999
Fig. 9. Construction time for Hierarchical 
NSW on 10M SIFT dataset for different 
numbers of threads on two CPUs. 
Fig. 10. Plots of the query time vs construc-
tion time tradeoff for Hierarchical NSW on 
10M SIFT dataset. 
Fig. 11. Plots of the ef parameter required 
to get fixed accuracies vs the dataset size 
for d=4 random vector data. 
