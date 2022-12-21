import React, { useEffect, useState } from "react";
import "./styles.css";
const index={NIFTY:"26000",BANKNIFTY:"26009"}
export default function App() {
  const [loginStatus,setloginStatus] = useState()
  const [positions,setPositions] = useState([])
  const [callList,setCallList] = useState([])
  const [putList,setPutList] = useState([])
  const [mtm,setMtm] = useState()
  const [selectedIndex,setSelectedIndex]=useState("BANKNIFTY")
  const [selectedExpiry,setSelectedExpiry]=useState("22DEC22")
  const [indexPrice,setIndexPrice]=useState()
  const [strikePrice,setStrikePrice]=useState()
  const [lotSize,setLotSize]=useState()
  const [premiumRange,setPremiumRange]=useState(150)
  const exchange="NFO"
  //https://shoonya.finvasia.com/NFO_symbols.txt.zip
  
  const login = ()=>{
    fetch('http://localhost:3300/login', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(result => {
      localStorage.setItem('token',result?.susertoken)
      setloginStatus(result)
    }
    )
    .catch(error => {
      console.error("Login failed.",error);
    })
    
  }
  const positionBook = ()=>{
    fetch('http://localhost:3300/position', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(result => {
      setPositions(result?.positions);
      setMtm(result?.MTM);
    }
    )
    .catch(error => {
      console.error("Positions failed.",error);
    })
  }

  const getQuotes= async (exchange,token)=>{
    return fetch(`http://localhost:3300/getquotes?exchange=${exchange}&token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {return response.json()})
    
    .catch(error => {
      console.error("getquotes failed.",error);
    })
  }
  const fetchIndexValue=(event)=>{
    setSelectedIndex(event.target.value)
  }
  const fetchScript=(event)=>{
    console.log(event.target.value)
  }
  const fetchOptionsChain=()=>{
    //exchange, tradingsymbol, strikeprice, count

    var body={}
    body.exchange=exchange
    body.tradingsymbol=selectedIndex+selectedExpiry+"C"+strikePrice
    body.strikeprice = parseFloat(strikePrice).toString()
    body.count="5"
    setCallList([]);
    setPutList([]);
    fetch('http://localhost:3300/optionchain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body:JSON.stringify(body)
    })
    .then(response => response.json())
    .then(result => {
      result.values.map((dat)=>{
        getQuotes(exchange,dat.token).then(result=>{
          if(parseFloat(result.lp)>premiumRange && parseFloat(result.lp)<premiumRange+100)
          result.optt === "CE"?setCallList(current => [...current,result]):setPutList(current => [...current,result])
        })
      })
    }
    )
    .catch(error => {
      console.error("Positions failed.",error);
    })
  }
  const placeOrder=(buyOrSell,symbol)=>{
    var order={}
    //  api.place_order(buy_or_sell='B', product_type='C',
//                         exchange='NSE', tradingsymbol='INFY-EQ', 
//                         quantity=1, discloseqty=0,price_type='LMT', price=1500, trigger_price=None,
//                         retention='DAY', remarks='my_order_001')
    order.buy_or_sell=buyOrSell;
    order.product_type="M";
    order.exchange=exchange;
    order.tradingsymbol=symbol;
    order.quantity=lotSize.toString();
    order.discloseqty="0";
    order.price_type="MKT"
    order.price="0";
    order.remarks="";
    
    fetch('http://localhost:3300/placeorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body:JSON.stringify(order)
    })
    .then(response => response.json())
    .then(result => {
      console.log(buyOrSell,result);
    }
    )
    .catch(error => {
      console.error("placeorder failed.",error);
    })
  }
  useEffect(()=>{
    login()
  },[])

  useEffect(()=>{
    if(selectedIndex === "NIFTY"){
      setStrikePrice(parseFloat(Math.round(indexPrice/50)*50))
      setLotSize(50)
    }
      else{
        setStrikePrice(parseFloat(Math.round(indexPrice/100)*100))
        setLotSize(25)
      }
  },[selectedIndex,indexPrice])

  useEffect(()=>{
    console.log(selectedExpiry)
  },[selectedExpiry])

  useEffect(() => {
    getQuotes("NSE",index[selectedIndex]).then(result=>{
      setIndexPrice(result?.lp)
    })
  }, [selectedIndex]);

  return (
    <div className="App">
      <h1 className="mainHeader">Scalping Terminal</h1>
      <div>
        <p>{loginStatus?`Logged In Successfully ${loginStatus?.uname}`:`Plaese Login`} </p>
      </div>
      <div className="firstSection">
        <button onClick={()=>login()}>Login</button>
        <button onClick={()=>positionBook()}>Positions</button>
        <select value={selectedIndex} onChange={(e)=>fetchIndexValue(e)}>
          <option value="NIFTY">Nifty</option>
          <option value="BANKNIFTY">BankNifty</option>
        </select>
        <input type="text" placeholder="Premium nearby" value={premiumRange} onChange={e=>setPremiumRange(parseInt(e.target.value))}></input>
        <select onChange={(e)=>setSelectedExpiry(e.target.value)}>
          <option value="22DEC22">22Dec22</option>
          <option value="29DEC22">29Dec22</option>
          <option value="05JAN23">05JAN23</option>
          <option value="12JAN23">12JAN23</option>
          <option value="19JAN23">19JAN23</option>
          <option value="25JAN23">25JAN23</option>
          <option value="02FEB23">02FEB23</option>
          <option value="09FEB23">09FEB23</option>
          <option value="23FEB23">23FEB23</option>
        </select>
      </div>
      {indexPrice&&<p>{selectedIndex+"--> "+indexPrice}</p>}
      {mtm && <div>
        MTM:{mtm}
      </div>}
      <div>
        <button onClick={()=>fetchOptionsChain()}>OptionChain</button>
      </div>
      <div className="optionChainSection">
        <div>
          <h3>CE</h3>
          {
            callList.sort((a, b) => a.strprc - b.strprc).map((calls) => (
              <div key={calls.tsym} className="optionChainSection">
              <p>{parseInt(parseFloat(calls.strprc))}</p>
              <p>{calls.lp}</p>
              {/* <input type="number" step={selectedIndex === "NIFTY"?50:25} value={lotSize} onChange={(e)=>setLotSize(e.target.value)}></input> */}
              <div>
                <button onClick={()=>setLotSize(lotSize-(selectedIndex === "NIFTY"?50:25))}>-</button>
                <input style={{width:20,padding:10}}type="text" value={lotSize}></input>
                <button onClick={()=>setLotSize(lotSize+(selectedIndex === "NIFTY"?50:25))}>+</button>
              </div>
              <button className="greenButton" onClick={()=>placeOrder("B",calls.tsym)}>B</button>
              <button className="redButton" onClick={()=>placeOrder("S",calls.tsym)}>S</button>
              </div>
            ))
          }
        </div>
        <div>
          <h3>PE</h3>
          {
            putList.sort((a, b) => b.strprc - a.strprc).map((puts) => (
              <div key={puts.tsym} className="optionChainSection">
              <p>{parseInt(parseFloat(puts.strprc))}</p>
              <p>{puts.lp}</p>
              <div>
                <button onClick={()=>setLotSize(lotSize-(selectedIndex === "NIFTY"?50:25))}>-</button>
                <input style={{width:20,padding:10}}type="text" value={lotSize}></input>
                <button onClick={()=>setLotSize(lotSize+(selectedIndex === "NIFTY"?50:25))}>+</button>
              </div>
              <button className="greenButton" onClick={()=>placeOrder("B",puts.tsym)}>B</button>
              <button className="redButton" onClick={()=>placeOrder("S",puts.tsym)}>S</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
