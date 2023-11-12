import {
    $query,
    $update,
    Record,
    StableBTreeMap,
    Vec,
    match,
    Result,
    nat64,
    ic,
    Opt,
    Principal,
  } from "azle";
  import { v4 as uuidv4 } from "uuid";
  
  type EnergyUsageData = Record<{
    date: nat64;
    consumption: number;
  }>;
  
  type EnergyAssessment = Record<{
    id: string;
    homeOwner: Principal;
    address: string;
    assessmentDate: nat64;
    efficiencyRating: number;
    recommendations: string;
    costSavings: number;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
    energyUsageHistory: Vec<EnergyUsageData>;
  }>;
  
  type EnergyAssessmentPayload = Record<{
    address: string;
    efficiencyRating: number;
    recommendations: string;
    costSavings: number;
  }>;
  
 
 
    const energyAssessmentStorage = new StableBTreeMap<string, EnergyAssessment>(0, 44, 1024);
  
  $update;
  export function createEnergyAssessment(payload: EnergyAssessmentPayload): Result<EnergyAssessment, string> {
    const assessment: EnergyAssessment = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      homeOwner: ic.caller(),
      assessmentDate: ic.time(),
      energyUsageHistory: [],
      ...payload,
    };
  
    energyAssessmentStorage.insert(assessment.id, assessment);
    return Result.Ok<EnergyAssessment, string>(assessment);
  }
  

  
  $query;
     export function getEnergyAssessment(id: string): Result<EnergyAssessment, string> {
    return match(energyAssessmentStorage.get(id), {
      Some: (assessment) => Result.Ok<EnergyAssessment, string>(assessment),
      None: () => Result.Err<EnergyAssessment, string>(`Energy Assessment with ID=${id} not found.`),
    });
  }
  
  $query;
     export function getAllEnergyAssessments(): Result<Vec<EnergyAssessment>, string> {
    return Result.Ok(energyAssessmentStorage.values());
  }
  
  $update;
     export function updateEnergyAssessment(id: string, payload: EnergyAssessmentPayload): Result<EnergyAssessment, string> {
    return match(energyAssessmentStorage.get(id), {
      Some: (existingAssessment) => {
        const updatedAssessment: EnergyAssessment = {
          ...existingAssessment,
          ...payload,
          updatedAt: Opt.Some(ic.time()),
        };
  
        energyAssessmentStorage.insert(updatedAssessment.id, updatedAssessment);
        return Result.Ok<EnergyAssessment, string>(updatedAssessment);
      },
      None: () => Result.Err<EnergyAssessment, string>(`Energy Assessment with ID=${id} not found.`),
    });
  }
  
  $update;
  
  
  export function deleteEnergyAssessment(id: string): Result<EnergyAssessment, string> {
    return match(energyAssessmentStorage.get(id), {
      Some: (existingAssessment) => {
        energyAssessmentStorage.remove(id);
        return Result.Ok<EnergyAssessment, string>(existingAssessment);
      },
      None: () => Result.Err<EnergyAssessment, string>(`Energy Assessment with ID=${id} not found.`),
    });
  }
  
  
  $update;
  
  
  
  export function addEnergyUsage(id: string, date: nat64, consumption: number): Result<EnergyAssessment, string> {
    return match(energyAssessmentStorage.get(id), {
      Some: (assessment) => {
        assessment.energyUsageHistory.push({ date, consumption });
        energyAssessmentStorage.insert(id, assessment);
        return Result.Ok<EnergyAssessment, string>(assessment);
      },
      None: () => Result.Err<EnergyAssessment, string>(`Energy Assessment with ID=${id} not found.`),
    });
  }
  
  $query;
  
  
  
  export function getEnergyUsageHistory(id: string): Result<Vec<EnergyUsageData>, string> {
    return match(energyAssessmentStorage.get(id), {
      Some: (asses) => Result.Ok<Vec<{ date: nat64; consumption: number }>,string>(asses.energyUsageHistory),
      None: () => Result.Err<Vec<{ date: nat64; consumption: number }>, string>(`Energy Assessment with ID=${id} not found.`),
    });
  }
  
  
  globalThis.crypto = {
    //@ts-ignore
    getRandomValues: () => {
      let array = new Uint8Array(32);
  
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
  
      return array;
    },
  };
  
  
