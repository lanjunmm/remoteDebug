import httpPlayer from '../palyers/http'
import jsonpPlayer from '../palyers/jsonp'
import Dom from "../palyers/dom";
import {EVENTS} from "../interfaces/types";

class PlayerClass {
    public events:EVENTS={
        dom:Dom,
        jsonp:jsonpPlayer,
        http:httpPlayer,
        default: () => {}
    };
    constructor(){}
}

const Player = new PlayerClass();

export default Player;
