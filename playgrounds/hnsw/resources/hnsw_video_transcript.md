# HNSW Explained - Video Transcript

Source: https://www.youtube.com/watch?v=77QH0Y2PYKg

hi there in this video we are going to
talk about one of the topics that I
found to be really interesting which is
Vector database search specifically we
are going to dive into one of the most
if not the most popular algorithms in
Vector database indexing the
hierarchical navigable small words to
start with let's define what we mean by
Vector databases and Vector search in
short Vector databases are used to store
High dimensional vectors where each
Vector represents some kind of data like
an image or a piece of text whose core
structure would be that The Closer those
vectors are the more similar the
corresponding data would be for instance
if we have the following two sentences
today the weather is sunny and it's a
sunny day they are quite similar and the
two vectors representing them should be
close to each other on the other hand
those two sentences to dat the weather
is sunny and Paris is the capital of
France have nothing in common so the
corresponding vectors should reside
further away compared to the previous
example and finally if we have the
following sentences which presentes
opposing facts their corresponding
vectors should be even further apart now
when it comes to Vector search the goal
of this task is to find the top K most
similar vectors to a given query Vector
the native approach would be to Simply
compute the similarity between the query
vector and every single Vector in the
database which is known as The Brute for
force method however as you can imagine
this approach becomes impractically slow
as the size of the database grows having
an O of end time complexity so how can
we do better one way to speed up the
search process is to use a data
structure called a navigable small W
which is a graph where each node
represents a vector the way we create
this graph is as follows imagine we have
a database of documents and each
document is represented by a vector
it can construct a navigable small word
graph by simply connecting each document
to its K most similar images in an
iterative way so we pick a document from
the database and we add it to the graph
then we pick another document we find a
Clos escate documents to that document
which right now is only the previous
document we have added so we link that
to then we add another document and we
connect it again with the K nearest
documents we have added so far and we
repeat this step again and again and
again until we have added all the
documents in the database in our graph
now let's say we want to find the most
similar documents to a query navigable
small wordss we start at a random node
in the graph and then we look at the
neighboring nodes and we move to the one
that's the closest to our query if the
distance of that neighboring node to the
query is smaller than the distance of
the current node to the query then we
look again at the neighboring nodes of
the next node node and we move to its
neighboring node as the closest to our
qu and this process is repeated until we
get a node where none of his neighbors
are closer to the query than that node
is also in practice this process of
randomly picking a node in the graph and
then navigating it is repeated several
times to collect a larger range of nodes
which is still much faster than the
Brute Force approach because we are only
considering a small subset of the entire
database the second important idea in
hierarchical navigable small wordss is a
data structure namely the skip link list
which is a variant of Link list where
each node can have a ski pointer that
points to our node further down the list
this allows us to quickly scrip over
large portions of the list making it
much faster to search now let me
illustrate this with an example let's
imagine that we have the following skip
Ling list and we are searching for the
node with the value 11 in it you can
observe here that each node has multiple
links to the other noes some of them
closer some of them further away and
that the higher levels tend to have less
links and the lower levels contain more
link with the lowest level containing
all the nodes so what do we do well we
start at the first node and ask is the
next node higher than 11 or smaller in
this case the next node is the end node
which means that we have to go down now
the next node is is 13 which is greater
than 11 so we go down again now we check
the next node which is lower than 11 so
we move to that node now the next node
is 13 again which is greater than 11 so
you mve down again the next node is now
11 which is exactly what we wanted to
find so we end the search and now to
create the hierarchical navigable small
wordss we combine the two concepts we
have presented so far navigable small
words and Skip link lists in this data
structure similarly to skip link list we
have a lower level which has more nodes
and more Connections in the upper level
which has less nodes and less
connections and we say that the bottom
level is more dense and the top one is
more sparse so how does the search work
in this graph suppose we have a query
just like before and we want to find the
closest K nodes to do that we again
select a random entry point in the upper
level of this graph and then visited now
he compared the cosign similarity of
this node and all of his neighbors with
the query and we obtained for instance
that this node is closest to we go down
we perform this step again we compute
the coign similarity of this node with
the query and all of his neighbors with
the query and we see that this note here
has a better cosign similarity score so
he go down again then we check this note
here with all his friends and we see
that this one is the closest one so we
go there also in this node We compare
the cosine of this node with the query
and all of his neighbors and see that
this one here has the best similarity so
we go down and then we do this test
again and calculate the cosine
similarity score of this node and the
query and also of all its neighbors with
the query and we see that this
neighboring node has the best similarity
so we go there finally when we are in
this node we observe that there is no
other neighor node that has a better
cosign similarity so we stop the
algorithm here now as in the navigable
small worlds algorithm the final step is
to take all these vectors that we have
visited sort them and return the topk
best matching based on the similarity
score that we are using before ending
this video I would like to talk a little
bit about what improvements we get by
using this type of vector search
compared to the Brute Force approach
which has an o of n time complexity
where n is the number of vectors in the
database in short the hierarchical
navigable small worlds algorithm offers
a significant Improvement in the average
search time complexity reducing it to
all log in the key Insight behind
heretical navigable small words is that
the hierarchical structure allows it to
take advantage of the property that
nearby vectors tend to be clustered
together in the high dimensional space
and by starting the search at the course
level and gradually refining it the
hierarchical navigable small WS can
efficiently eliminate large regions of
the Sur space that are unlikely to
contain the target V this results in a
significant reduction in the number of
vectors that need to be examined leing
to a Time complexity of all of log in
and that's basic lead folks thanks for
watching please hit the like button if
you enjoy this explanation and don't
forget to subscribe if you want to stay
up toate with the content I create on
this channel
see you next time bye-bye