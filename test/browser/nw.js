describe('nw', function () {
    var mocks = [];

    function mockAjax (callback) {
        mocks.push(sinon.stub($, 'ajax', function (url, options) {
            var deferred = $.Deferred();
            setTimeout(function () {
                callback(deferred);
            }, 0);
            return deferred;
        }));
    };

    afterEach(function () {
        _.each(mocks, function (mock) {
            mock.restore();
        });
        mocks = [];
    });

    describe('#rpc()', function () {
        var url = 'mock';
        var options = {
            type: 'post',
            data: {
                a: '1',
                b: '2'
            },
        };

        it('should call jQuery.ajax with right options', function () {
            mocks.push(sinon.spy($, 'ajax'));

            nw.rpc(url, options);

            expect($.ajax.calledOnce).to.be.ok();
            var call = $.ajax.lastCall;

            expect(call.args[0]).to.be(url);

            _.each(options, function (value, name) {
                expect(call.args[1][name]).to.be(value);
            });

            expect(call.args[1].dataType).to.be('json');
        });

        it('should redirect to login when unauthorized', function (done) {
            mockAjax(function (deferred) {
                deferred.reject({
                    status: 401,
                    statusText: 'unathorized'
                });
            });

            mocks.push(sinon.stub(nw, 'redirect'));
            nw.rpc(url, options);

            setTimeout(function () {
                expect(nw.redirect.calledOnce).to.be.ok();
                nw.redirect.lastCall.args[0].to.be('.');
                done();
            }, 100);
        });

        it('should alert on failure', function (done) {
            mockAjax(function (deferred) {
                deferred.reject({
                    status: 500,
                    statusText: 'server error'
                });
            });

            mocks.push(sinon.stub(window, 'alert'));
            nw.rpc(url, options);

            setTimeout(function () {
                expect(window.alert.calledOnce).to.be.ok();
                done();
            }, 100);
        });

        it('should parse error response', function (done) {
            mockAjax(function (deferred) {
                deferred.resolve({
                    status: 'err',
                    body: 'error body'
                });
            });

            var doneCallback = sinon.spy();
            var failCallback = sinon.spy();

            nw.rpc(url, options)
                .done(doneCallback)
                .fail(function (err) {
                    expect(err).to.be('error body');
                    failCallback();
                });
            
            setTimeout(function () {
                expect(doneCallback.called).to.not.be.ok();
                expect(failCallback.called).to.be.ok();
                done();
            }, 100);
        });

        it('should parse ok response', function (done) {
            mockAjax(function (deferred) {
                deferred.resolve({
                    status: 'ok',
                    body: 'response body'
                });
            });

            var doneCallback = sinon.spy();
            var failCallback = sinon.spy();

            nw.rpc(url, options)
                .fail(failCallback)
                .done(function (body) {
                    expect(body).to.be('response body');
                    doneCallback();
                });
            
            setTimeout(function () {
                expect(doneCallback.called).to.be.ok();
                expect(failCallback.called).to.not.be.ok();
                done();
            }, 100);
        });

        it('should alert on unexpected error', function (done) {
            mockAjax(function (deferred) {
                deferred.resolve({
                    status: 'err',
                    body: 'error body'
                });
            });

            nw.rpc(url, options).done(function () {});
            mocks.push(sinon.stub(window, 'alert'));
            
            setTimeout(function () {
                expect(window.alert.calledOnce).to.be.ok();
                done();
            }, 100);
        });
    });

    describe('#post()', function () {
        it('should call #rpc() with post type', function () {
            mocks.push(sinon.spy(nw, 'rpc'));
            nw.post('mock');
            expect(nw.rpc.calledOnce).to.be.ok();
            expect(nw.rpc.lastCall.args[1].type).to.be('post');
        });
    });

    describe('#get()', function () {
        it('should call #rpc() with get type', function () {
            mocks.push(sinon.spy(nw, 'rpc'));
            nw.get('mock');
            expect(nw.rpc.calledOnce).to.be.ok();
            expect(nw.rpc.lastCall.args[1].type).to.be('get');
        });
    });
});
