'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _reactDom = require('react-dom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var refresherStates = {
    _INITAL: 'initial',
    _PULLING: 'pulling',
    _REFRESHING: 'refreshing',
    _CANCELLING: 'cancelling'
};

var Refresher = function (_Component) {
    _inherits(Refresher, _Component);

    function Refresher(props) {
        _classCallCheck(this, Refresher);

        var _this = _possibleConstructorReturn(this, (Refresher.__proto__ || Object.getPrototypeOf(Refresher)).call(this, props));

        _this.state = {
            height: _this.props.maxPullingHeight || 60,
            transitionDuration: _this.props.transitionDuration || 180,
            parentNode: null,
            initialY: 0,
            touchY: 0,
            percentagePulling: 0,
            refresherState: refresherStates._INITAL
        };
        _this._touchStart = _this._touchStart.bind(_this);
        _this._touchMove = _this._touchMove.bind(_this);
        _this._touchEnd = _this._touchEnd.bind(_this);
        return _this;
    }

    _createClass(Refresher, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            var pn = (0, _reactDom.findDOMNode)(this) && (0, _reactDom.findDOMNode)(this).parentNode;
            pn.style.transition = this.state.transitionDuration + 'ms linear';
            pn.style.transform = 'translateY(-' + this.state.height + 'px)';

            pn.addEventListener('touchstart', this._touchStart);
            pn.addEventListener('touchmove', this._touchMove);
            pn.addEventListener('touchend', this._touchEnd);
            this.setState({ parentNode: pn });
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            var pn = this.state.parentNode;
            pn.addEventListener('touchstart', this._touchStart);
        }
    }, {
        key: '_touchStart',
        value: function _touchStart(e) {
            if (this.state.refresherState === refresherStates._REFRESHING) return;
            if (e.touches.length > 1) return;
            var pn = this.state.parentNode;
            this.setState({ initialY: e.touches[0].pageY });
            if (document.body.scrollTop <= 0) {
                pn.style.overflow = "hidden";

                pn.addEventListener('touchmove', this._touchMove);
                pn.addEventListener('touchend', this._touchEnd);
            }
        }
    }, {
        key: '_touchMove',
        value: function _touchMove(e) {
            var pn = this.state.parentNode;
            if (document && document.body.scrollTop <= 0 && e.touches[0].pageY - this.state.initialY > 0) {
                // prevent mobile chrome pull to refresh
                e.preventDefault();
                if (this.state.refresherState === refresherStates._REFRESHING) return;
                var touchY = (e.touches[0].pageY - this.state.initialY) * (this.props.velocity || 0.5);

                var percentagePulling = touchY * 100 / this.state.height;
                this.setState({
                    percentagePulling: percentagePulling > 100 ? 100 : parseInt(percentagePulling),
                    refresherState: refresherStates._PULLING,
                    touchY: touchY
                });
                if (this.state.height - this.state.touchY > 0) {
                    pn.style.transform = 'translateY(-' + (this.state.height - this.state.touchY) + 'px)';
                } else {
                    pn.style.transform = 'translateY(' + (this.state.touchY - this.state.height) + 'px)';
                }
            } else {
                this.setState({ refresherState: refresherStates._INITAL });
                pn.style.overflow = "";
                pn.removeEventListener('touchmove', this._touchMove);
            }
        }
    }, {
        key: '_touchEnd',
        value: function _touchEnd(e) {
            var _this2 = this;

            if (this.state.refresherState === refresherStates._REFRESHING) return;

            var pn = this.state.parentNode;
            pn.removeEventListener('touchmove', this.touchMove);
            pn.style.overflow = "";

            var raz = function raz() {
                var myThis = _this2;
                pn.style.transform = 'translateY(-' + _this2.state.height + 'px)';
                setTimeout(function () {
                    _this2.setState({
                        touchY: 0,
                        percentagePulling: 0,
                        refresherState: refresherStates._INITAL
                    });
                }, _this2.state.transitionDuration);
            };

            if (this.state.touchY >= this.state.height) {
                this.setState({
                    touchY: this.state.height,
                    refresherState: refresherStates._REFRESHING
                });
                pn.style.transform = 'translateY(0px)';

                this._refreshing().done(function () {
                    raz();
                });
            } else {
                raz();
            }
        }
    }, {
        key: '_refreshing',
        value: function _refreshing() {
            if (this.props.refreshingFunc) {
                return new Promise(this.props.refreshingFunc);
            } else {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        resolve();
                    }, 1000);
                });
            }
        }
    }, {
        key: 'render',
        value: function render() {
            var refresherContainerStyle = Object.assign({}, {
                height: this.state.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }, this.props.style);
            return _react2.default.createElement(
                'div',
                { style: refresherContainerStyle },
                this.state.refresherState === refresherStates._PULLING && (this.props.pullingRender && this.props.pullingRender(this.state.percentagePulling) || _react2.default.createElement(
                    'div',
                    null,
                    'pulling ',
                    this.state.percentagePulling,
                    '%'
                )),
                this.state.refresherState === refresherStates._REFRESHING && (this.props.refreshingRender || _react2.default.createElement(
                    'div',
                    null,
                    'refreshing'
                ))
            );
        }
    }]);

    return Refresher;
}(_react.Component);

exports.default = Refresher;


Refresher.propTypes = {
    maxPullingHeight: _propTypes.PropTypes.number,
    velocity: _propTypes.PropTypes.number,
    transitionDuration: _propTypes.PropTypes.number,
    style: _propTypes.PropTypes.object,
    pullingRender: _propTypes.PropTypes.func,
    refreshingRender: _propTypes.PropTypes.func,
    refreshingFunc: _propTypes.PropTypes.func
};
