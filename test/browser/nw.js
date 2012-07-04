describe('nw', function () {
    var mocks = [];
    var defaultBody = 'mock body';

    beforeEach(function () {
        mocks.push(sinon.stub($, 'ajax', function (url, options) {
            var deferred = $.Deferred();
            setTimeout(function () {
                if ($.ajax.mockResolve) {
                    $.ajax.mockResolve(deferred);
                } else {
                    deferred.resolve({
                        status: 'ok',
                        body: defaultBody
                    });
                }
            }, 0);
            return deferred;
        }));
    });

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
            $.ajax.mockResolve = function (deferred) {
                deferred.reject({
                    status: 401,
                    statusText: 'unathorized'
                });
            };
            mocks.push(sinon.stub(nw, 'redirect'));

            nw.rpc(url, options);

            setTimeout(function () {
                expect(nw.redirect.calledOnce).to.be.ok();
                expect(nw.redirect.lastCall.args[0]).to.be('.');
                done();
            }, 100);
        });

        it('should alert on failure', function (done) {
            $.ajax.mockResolve = function (deferred) {
                deferred.reject({
                    status: 500,
                    statusText: 'server error'
                });
            };
            mocks.push(sinon.stub(window, 'alert'));

            nw.rpc(url, options);

            setTimeout(function () {
                expect(window.alert.calledOnce).to.be.ok();
                done();
            }, 100);
        });

        it('should parse error response', function (done) {
            $.ajax.mockResolve = function (deferred) {
                deferred.resolve({
                    status: 'err',
                    body: 'error body'
                });
            };

            var doneCallback = sinon.spy();
            var failCallback = sinon.spy();

            var deferred = nw.rpc(url, options)
                .done(doneCallback)
                .fail(function (err) {
                    expect(err).to.be('error body');
                    failCallback();
                })
            
            setTimeout(function () {
                expect(doneCallback.called).to.not.be.ok();
                expect(failCallback.called).to.be.ok();
                done();
            }, 100);
        });

        it('should parse ok response', function (done) {
            var doneCallback = sinon.spy();
            var failCallback = sinon.spy();

            nw.rpc(url, options)
                .fail(failCallback)
                .done(function (body) {
                    expect(body).to.be(defaultBody);
                    doneCallback();
                });
            
            setTimeout(function () {
                expect(doneCallback.called).to.be.ok();
                expect(failCallback.called).to.not.be.ok();
                done();
            }, 100);
        });

        it('should alert on unexpected error', function (done) {
            $.ajax.mockResolve = function (deferred) {
                deferred.resolve({
                    status: 'err',
                    body: 'error body'
                });
            };

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
            var data = {
                a: 1,
                b: 2
            };
            nw.post('mock', data);
            expect(nw.rpc.calledOnce).to.be.ok();
            expect(nw.rpc.lastCall.args[1].type).to.be('post');
            expect(nw.rpc.lastCall.args[1].data).to.be(data);
        });
    });

    describe('#get()', function () {
        it('should call #rpc() with get type', function () {
            mocks.push(sinon.spy(nw, 'rpc'));
            var data = {
                a: 1,
                b: 2
            };
            nw.get('mock', data);
            expect(nw.rpc.calledOnce).to.be.ok();
            expect(nw.rpc.lastCall.args[1].type).to.be('get');
            expect(nw.rpc.lastCall.args[1].data).to.be(data);
        });
    });
});
