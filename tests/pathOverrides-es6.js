describe("Nested routes tests", function() {
  it("routes default get paths", function(done) {
    utils.getAndCheck("http://localhost:3000/books/foo/details", {}, done, obj => assert.isTrue(obj.received));
  });

  it("rejects default get paths that was overridden", function(done) {
    utils.verbsAreRejected("http://localhost:3000/books/foo/details", done, ["post", "put", "delete"]);
  });

  it("handles parameters correctly on an overridden global path C", function(done) {
    utils.postAndCheck("http://localhost:3000/global-path-foo/15?x=1", { y: 2 }, done, obj => assert.deepEqual(obj, { x: "1", y: 2, userId: "15" }));
  });

  it("rejects opted-in verbs on original paths that was overridden ", function(done) {
    utils.verbsAreRejected("http://localhost:3000/global-path-foo/12", done, ["get", "put", "delete"]);
  });
});
