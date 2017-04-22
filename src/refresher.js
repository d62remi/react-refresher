import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { findDOMNode } from 'react-dom';

const refresherStates = {
    _INITAL: 'initial',
    _PULLING: 'pulling',
    _REFRESHING: 'refreshing',
    _CANCELLING: 'cancelling',
}

export default class Refresher extends Component {
  constructor(props) {
    super(props);
    this.state = {
        height: this.props.maxPullingHeight || 60,
        transitionDuration: this.props.transitionDuration || 180,
        parentNode: null,
        initialY: 0,
        touchY: 0,
        percentagePulling: 0,
        refresherState: refresherStates._INITAL,
    };
    this._touchStart = this._touchStart.bind(this)
    this._touchMove  = this._touchMove.bind(this)
    this._touchEnd   = this._touchEnd.bind(this)
  }

  componentDidMount() {
    let pn = findDOMNode(this) && findDOMNode(this).parentNode
    pn.style.transition = `${this.state.transitionDuration}ms linear`
    pn.style.transform = `translateY(-${this.state.height}px)` 

    pn.addEventListener('touchstart',this._touchStart)
    pn.addEventListener('touchmove',this._touchMove)
    pn.addEventListener('touchend',this._touchEnd)
    this.setState({parentNode:pn})

  }
  componentWillUnmount() {
    const pn = this.state.parentNode
    pn.addEventListener('touchstart',this._touchStart)
    
  }
  
  _touchStart(e){
    if(this.state.refresherState === refresherStates._REFRESHING) return;
    if(e.touches.length>1) return;
    const pn = this.state.parentNode
    this.setState({initialY: e.touches[0].pageY})
    if(document.body.scrollTop <= 0){
      pn.style.overflow = "hidden";

      pn.addEventListener('touchmove',this._touchMove)
      pn.addEventListener('touchend',this._touchEnd)
    }
  }
  _touchMove(e) {
    const pn = this.state.parentNode
    if(document && document.body.scrollTop <= 0 && e.touches[0].pageY - this.state.initialY > 0){      
      // prevent mobile chrome pull to refresh
      e.preventDefault();  
      if(this.state.refresherState === refresherStates._REFRESHING) return;
      let touchY = (e.touches[0].pageY - this.state.initialY) * (this.props.velocity || 0.5)     
      
      const percentagePulling = touchY * 100 / this.state.height
      this.setState({        
          percentagePulling: (percentagePulling > 100 ? 100 : parseInt(percentagePulling)),
          refresherState: refresherStates._PULLING,
          touchY,
      })   
      if(this.state.height-this.state.touchY > 0 ){
        pn.style.transform = `translateY(-${this.state.height-this.state.touchY}px)`
      }else{
        pn.style.transform = `translateY(${this.state.touchY-this.state.height}px)`
      }
      
    }else{
      this.setState({refresherState: refresherStates._INITAL})
      pn.style.overflow = "";
      pn.removeEventListener('touchmove',this._touchMove)
    }
  }
  _touchEnd(e) {
    if(this.state.refresherState === refresherStates._REFRESHING) return;

    const pn = this.state.parentNode
    pn.removeEventListener('touchmove',this.touchMove)
    pn.style.overflow = "";
    
    const raz = () => {
        const myThis = this
        pn.style.transform = `translateY(-${this.state.height}px)`
        setTimeout(()=>{
            this.setState({
                touchY:0,
                percentagePulling: 0,
                refresherState: refresherStates._INITAL
            })
        },this.state.transitionDuration)
    }

    if(this.state.touchY >= this.state.height){
        this.setState({
            touchY:this.state.height,
            refresherState: refresherStates._REFRESHING,
        })
        pn.style.transform = `translateY(0px)`
        
        this._refreshing()
        .done(()=>{
            raz()
        })
    }else{
        raz()
    }    
  }
  _refreshing(){
      if(this.props.refreshingFunc){
        return new Promise(this.props.refreshingFunc)
      }else{
        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                resolve()
            },1000)
        })
      }
  }
  render() {
    const refresherContainerStyle = Object.assign({},{
        height: this.state.height,  
        display: 'flex',  
        alignItems: 'center', 
        justifyContent: 'center'
    },this.props.style)
    return (
        <div style={refresherContainerStyle}>
            {this.state.refresherState === refresherStates._PULLING && ((this.props.pullingRender && this.props.pullingRender(this.state.percentagePulling)) || (
                <div>pulling {this.state.percentagePulling}%</div>
            ))}
            {this.state.refresherState === refresherStates._REFRESHING && (this.props.refreshingRender || (
                <div>refreshing</div>
            ))}        
        </div>
    )
  }
}

Refresher.propTypes = {
  maxPullingHeight: PropTypes.number,
  velocity: PropTypes.number,
  transitionDuration: PropTypes.number,
  style: PropTypes.object,
  pullingRender: PropTypes.func,
  refreshingRender: PropTypes.func,
  refreshingFunc: PropTypes.func,
};