import axios from 'axios';
import {format, parse} from 'date-fns';
import React, {useEffect, useRef, useState} from 'react';
// import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Link} from 'react-router-dom';

import {formatNumber, parseStateTimeseries} from '../utils/common-functions';
import {MAP_META, STATE_CODES} from '../constants';

import Level from './level';
import MapExplorer from './mapexplorer';
import Minigraph from './minigraph';
import TimeSeries from './timeseries';

function State(props) {
  // For scroll buttons
  const mapRef = useRef();
  const tsRef = useRef();

  // const [data, setData] = useState(props.data);
  const [fetched, setFetched] = useState(false);
  const [timeseries, setTimeseries] = useState({});
  const [graphOption, setGraphOption] = useState(1);
  const [timeseriesMode, setTimeseriesMode] = useState(true);
  const [timeseriesLogMode, setTimeseriesLogMode] = useState(false);
  const [stateData, setStateData] = useState({});
  const [testData, setTestData] = useState({});
  const [districtData, setDistrictData] = useState({});
  // const [stateTestData, setStateTestData] = useState({});
  // const [timeseriesMode, setTimeseriesMode] = useState(true);
  // const [timeseriesLogMode, setTimeseriesLogMode] = useState(false);

  // Assuming routing is already handled, this would always correspond to a state code
  const stateCode = window.location.pathname.split('/').pop().toUpperCase();
  const stateName = STATE_CODES[stateCode];

  useEffect(() => {
    if (fetched === false) {
      getState(stateCode);
    }
  }, [fetched, stateCode]);

  const getState = async (code) => {
    try {
      const [
        {data: dataResponse},
        {data: stateDistrictWiseResponse},
        {data: statesDailyResponse},
        {data: stateTestResponse},
      ] = await Promise.all([
        axios.get('https://api.covid19india.org/data.json'),
        axios.get('https://api.covid19india.org/state_district_wise.json'),
        axios.get('https://api.covid19india.org/states_daily.json'),
        axios.get('https://api.covid19india.org/state_test_data.json'),
      ]);
      const states = dataResponse.statewise;
      setStateData(states.find((s) => s.statecode === code));
      const ts = parseStateTimeseries(statesDailyResponse)[code];
      setTimeseries(ts);
      // setLastUpdated(response.data.statewise[0].lastupdatedtime);
      const statesTests = stateTestResponse.states_tested_data;
      const name = STATE_CODES[code];
      setTestData(
        statesTests.filter(
          (obj) => obj.state === name && obj.totaltested !== ''
        )
      );
      setDistrictData({
        [name]: stateDistrictWiseResponse[name],
      });
      setFetched(true);
    } catch (err) {
      console.log(err);
    }
  };

  const testObjLast = testData[testData.length - 1];

  return (
    <React.Fragment>
      <div className="State">
        <div className="state-left">
          <div className="breadcrumb fadeInUp">
            <Link to="/">Home</Link>/
            <Link to={`${stateCode}`}>{stateName}</Link>
          </div>
          <div className="header">
            <div
              className="header-left fadeInUp"
              style={{animationDelay: '0.3s'}}
            >
              <h1>{stateName}</h1>
              <h5>11 Apr, 04:32 IST</h5>
            </div>
            <div
              className="header-right fadeInUp"
              style={{animationDelay: '0.5s'}}
            >
              <h5>Tested</h5>
              <h2>{formatNumber(testObjLast?.totaltested)}</h2>
              <h5 className="timestamp">
                {!isNaN(parse(testObjLast?.updatedon, 'dd/MM/yyyy', new Date()))
                  ? `As of ${format(
                      parse(testObjLast?.updatedon, 'dd/MM/yyyy', new Date()),
                      'dd MMM'
                    )}`
                  : ''}
              </h5>
              <h5>
                {'per '}
                {testObjLast?.totaltested && (
                  <a href={testObjLast.source} target="_noblank">
                    source
                  </a>
                )}
              </h5>
            </div>
          </div>

          {fetched && <Level data={stateData} />}
          {fetched && <Minigraph timeseries={timeseries} />}
          {fetched && (
            <React.Fragment>
              {
                <MapExplorer
                  forwardRef={mapRef}
                  mapMeta={MAP_META[stateName]}
                  states={[stateData]}
                  stateDistrictWiseData={districtData}
                  stateTestData={testData}
                />
              }
            </React.Fragment>
          )}
        </div>

        <div className="state-right">
          {fetched && (
            <React.Fragment>
              <div
                className="timeseries-header fadeInUp"
                style={{animationDelay: '2.5s'}}
                ref={tsRef}
              >
                <h1>Spread Trends</h1>
                <div className="tabs">
                  <div
                    className={`tab ${graphOption === 1 ? 'focused' : ''}`}
                    onClick={() => {
                      setGraphOption(1);
                    }}
                  >
                    <h4>Cumulative</h4>
                  </div>
                  <div
                    className={`tab ${graphOption === 2 ? 'focused' : ''}`}
                    onClick={() => {
                      setGraphOption(2);
                    }}
                  >
                    <h4>Daily</h4>
                  </div>
                </div>

                <div className="scale-modes">
                  <label className="main">Scale Modes</label>
                  <div className="timeseries-mode">
                    <label htmlFor="timeseries-mode">Uniform</label>
                    <input
                      type="checkbox"
                      checked={timeseriesMode}
                      className="switch"
                      aria-label="Checked by default to scale uniformly."
                      onChange={(event) => {
                        setTimeseriesMode(!timeseriesMode);
                      }}
                    />
                  </div>
                  <div
                    className={`timeseries-logmode ${
                      graphOption !== 1 ? 'disabled' : ''
                    }`}
                  >
                    <label htmlFor="timeseries-logmode">Logarithmic</label>
                    <input
                      type="checkbox"
                      checked={graphOption === 1 && timeseriesLogMode}
                      className="switch"
                      disabled={graphOption !== 1}
                      onChange={(event) => {
                        setTimeseriesLogMode(!timeseriesLogMode);
                      }}
                    />
                  </div>
                </div>
              </div>

              <TimeSeries
                timeseries={timeseries}
                type={graphOption}
                mode={timeseriesMode}
                logMode={timeseriesLogMode}
              />
            </React.Fragment>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

export default State;
