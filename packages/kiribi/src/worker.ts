import Kiribi from './index';
import client from './client';
import rest from './rest';

export default class extends Kiribi {
	client = client;
	rest = rest;
}
