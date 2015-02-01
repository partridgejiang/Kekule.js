task :test do
  sh "
    # Press Ctrl-C to shutdown the test server
    cd src
    open http://localhost:8000/tests/tests.htm
    python -c 'import SimpleHTTPServer; SimpleHTTPServer.test()'
  "
end
