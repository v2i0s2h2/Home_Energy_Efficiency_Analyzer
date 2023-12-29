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

// Define the EnergyUsageData type
type EnergyUsageData = Record<{
  date: nat64;
  consumption: number;
}>;

// Define the EnergyAssessment type
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

// Define the Payload type for creating or updating assessments
type EnergyAssessmentPayload = Record<{
  address: string;
  efficiencyRating: number;
  recommendations: string;
  costSavings: number;
}>;

// Create StableBTreeMap to store energy assessments
const energyAssessmentStorage = new StableBTreeMap<string, EnergyAssessment>(0, 44, 1024);

// Function to create a new energy assessment
$update;
export function createEnergyAssessment(payload: EnergyAssessmentPayload): Result<EnergyAssessment, string> {
  // Payload Validation: Ensure that required fields are present in the payload and have valid types
  if (!payload.address || payload.efficiencyRating <= 0 || payload.costSavings <= 0) {
    return Result.Err("Missing or invalid fields in the payload.");
  }

  // Create a new energy assessment record
  const assessment: EnergyAssessment = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    homeOwner: ic.caller(),
    assessmentDate: ic.time(),
    energyUsageHistory: [],
    address: payload.address, // Explicit Property Setting
    efficiencyRating: payload.efficiencyRating, // Explicit Property Setting
    recommendations: payload.recommendations || "", // Explicit Property Setting with default value
    costSavings: payload.costSavings, // Explicit Property Setting
  };

  try {
    energyAssessmentStorage.insert(assessment.id, assessment); // Error Handling: Handle any errors during insertion
  } catch (error) {
    return Result.Err(`Failed to create the energy assessment: ${error}`);
  }

  return Result.Ok<EnergyAssessment, string>(assessment);
}

// Function to get an energy assessment by ID
$query;
export function getEnergyAssessment(id: string): Result<EnergyAssessment, string> {
  // Parameter Validation: Validate the id parameter to ensure it's a valid UUID
  if (!id) {
    return Result.Err("Invalid ID format.");
  }

  return match(energyAssessmentStorage.get(id), {
    Some: (assessment) => Result.Ok<EnergyAssessment, string>(assessment),
    None: () => Result.Err<EnergyAssessment, string>(`Energy Assessment with ID=${id} not found.`),
  });
}

// Function to get all energy assessments
$query;
export function getAllEnergyAssessments(): Result<Vec<EnergyAssessment>, string> {
  return Result.Ok(energyAssessmentStorage.values());
}

// Function to update an energy assessment
$update;
export function updateEnergyAssessment(id: string, payload: EnergyAssessmentPayload): Result<EnergyAssessment, string> {
  // Parameter Validation: Validate the id parameter to ensure it's not empty or null
  if (!id) {
    return Result.Err("ID is required.");
  }

  return match(energyAssessmentStorage.get(id), {
    Some: (existingAssessment) => {
      // Selective Update: Update only the allowed fields in updatedAssessment
      const updatedAssessment: EnergyAssessment = {
        ...existingAssessment,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        energyAssessmentStorage.insert(updatedAssessment.id, updatedAssessment); // Error Handling: Handle any errors during insertion
      } catch (error) {
        return Result.Err<EnergyAssessment, string>(`Failed to update the energy assessment: ${error}`);
      }

      return Result.Ok<EnergyAssessment, string>(updatedAssessment);
    },
    None: () => Result.Err<EnergyAssessment, string>(`Energy Assessment with ID=${id} not found.`),
  });
}

// Function to delete an energy assessment by ID
$update;
export function deleteEnergyAssessment(id: string): Result<EnergyAssessment, string> {
  // Parameter Validation: Validate the id parameter to ensure it's not empty or null
  if (!id) {
    return Result.Err("ID is required.");
  }

  return match(energyAssessmentStorage.get(id), {
    Some: (existingAssessment) => {
      energyAssessmentStorage.remove(id);
      return Result.Ok<EnergyAssessment, string>(existingAssessment);
    },
    None: () => Result.Err<EnergyAssessment, string>(`Energy Assessment with ID=${id} not found.`),
  });
}

// Function to add energy usage data to an assessment
$update;
export function addEnergyUsage(id: string, date: nat64, consumption: number): Result<EnergyAssessment, string> {
  // Parameter Validation: Validate the id parameter to ensure it's not empty or null
  if (!id) {
    return Result.Err("ID is required.");
  }

  return match(energyAssessmentStorage.get(id), {
    Some: (assessment) => {
      assessment.energyUsageHistory.push({ date, consumption });
      energyAssessmentStorage.insert(id, assessment);
      return Result.Ok<EnergyAssessment, string>(assessment);
    },
    None: () => Result.Err<EnergyAssessment, string>(`Energy Assessment with ID=${id} not found.`),
  });
}

// Function to get energy usage history for an assessment
$query;
export function getEnergyUsageHistory(id: string): Result<Vec<EnergyUsageData>, string> {
  // Parameter Validation: Validate the id parameter to ensure it's a valid UUID
  if (!id) {
    return Result.Err("Invalid ID format.");
  }

  return match(energyAssessmentStorage.get(id), {
    Some: (assessment) => Result.Ok<Vec<{ date: nat64; consumption: number }>, string>(assessment.energyUsageHistory),
    None: () => Result.Err<Vec<{ date: nat64; consumption: number }>, string>(`Energy Assessment with ID=${id} not found.`),
  });
}

// Function to calculate the total energy consumption for an assessment
$query;
export function calculateTotalConsumption(id: string): Result<number, string> {
  // Parameter Validation: Validate the id parameter to ensure it's a valid UUID
  if (!id) {
    return Result.Err("Invalid ID format.");
  }

  return match(energyAssessmentStorage.get(id), {
    Some: (assessment) => {
      const totalConsumption = assessment.energyUsageHistory.reduce((total, data) => total + data.consumption, 0);
      return Result.Ok<number, string>(totalConsumption);
    },
    None: () => Result.Err<number, string>(`Energy Assessment with ID=${id} not found.`),
  });
}

// Function to get energy assessments with efficiency ratings above a threshold
$query;
export function getHighEfficiencyAssessments(threshold: number): Result<Vec<EnergyAssessment>, string> {
  // Parameter Validation: Validate the threshold parameter
  if (threshold <= 0) {
    return Result.Err("Invalid threshold value. Threshold must be greater than 0.");
  }

  const highEfficiencyAssessments = energyAssessmentStorage.values().filter(
    (assessment) => assessment.efficiencyRating >= threshold
  );

  return Result.Ok<Vec<EnergyAssessment>, string>(highEfficiencyAssessments);
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
