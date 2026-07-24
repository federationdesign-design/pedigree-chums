// Data bundle for the browser (Next bundles the JSON). The Node test harness
// builds the same ChumData shape from disk instead, so the pure engine never
// imports JSON directly and runs identically in both environments.

import collieResponses from '../data/generated/collie-responses.json';
import destinations from '../data/generated/destinations.json';
import faq from '../data/generated/faq.json';
import generalKnowledge from '../data/generated/general-knowledge.json';
import articles from '../data/generated/articles.json';
import transfers from '../data/generated/transfers.json';
import copyComponents from '../data/generated/copy-components.json';
import dogs from '../data/generated/dogs.json';
import {
  ChumData,
  CollieResponse,
  Destination,
  FaqRecord,
  GeneralKnowledge,
  Article,
  TransferRule,
  CopyComponent,
  DogRecord,
} from './types';

export const CHUM_DATA: ChumData = {
  collieResponses: collieResponses as unknown as CollieResponse[],
  destinations: destinations as unknown as Destination[],
  faq: faq as unknown as FaqRecord[],
  generalKnowledge: generalKnowledge as unknown as GeneralKnowledge[],
  articles: articles as unknown as Article[],
  transfers: transfers as unknown as TransferRule[],
  copyComponents: copyComponents as unknown as CopyComponent[],
  dogs: dogs as unknown as DogRecord[],
};
