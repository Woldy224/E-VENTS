import React, { useState } from "react";

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function LegalDisclaimerModal({ isOpen, onAccept, onDecline }: LegalDisclaimerModalProps) {
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Conditions – Responsabilité & Confidentialité</h2>
          <p className="text-sm text-gray-600 mt-1">
            Veuillez lire et accepter avant de continuer.
          </p>
        </div>

        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4 text-gray-800">
          <p className="text-sm">
            La plateforme <span className="font-semibold">Secure Events</span> fournit un outil de publication, de gestion et de réservation
            d’événements. <span className="font-semibold">Secure Events n’est pas l’organisateur</span> des événements publiés.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">Limitation de responsabilité</h3>
            <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
              <li>Secure Events ne peut être tenue responsable en cas <b>d’annulation</b>, de <b>report</b> ou de modification d’un événement.</li>
              <li>Secure Events ne garantit pas l’exactitude des informations fournies par l’organisateur (programme, horaires, capacité, etc.).</li>
              <li>Secure Events n’est pas responsable des incidents survenus sur le lieu de l’événement (sécurité, dommages, pertes, etc.).</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Lieu & organisation</h3>
            <p className="text-sm text-blue-900">
              L’organisateur est seul responsable du choix du lieu, des autorisations, de la logistique et de la sécurité.
              Secure Events ne garantit ni la disponibilité ni la conformité du lieu indiqué.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Paiements, frais & remboursements</h3>
            <ul className="list-disc pl-5 text-sm text-green-900 space-y-1">
              <li>Secure Events n’est pas responsable des litiges financiers entre participants et organisateurs.</li>
              <li>Les demandes de remboursement (annulation, report, changement de programme, etc.) doivent être adressées à l’organisateur.</li>
              <li>Secure Events n’est pas responsable des frais engagés par les participants (transport, hébergement, etc.).</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Confidentialité (résumé)</h3>
            <p className="text-sm text-gray-700">
              Nous collectons uniquement les informations nécessaires au fonctionnement du service (création de compte, gestion des événements et
              tickets, sécurité). Les mots de passe sont stockés sous forme de <b>hash</b> et nous ne vendons pas vos données.
            </p>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              id="legal_accept"
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <label htmlFor="legal_accept" className="text-sm text-gray-700">
              Je reconnais avoir lu et j’accepte ces conditions.
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onDecline}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Je refuse
          </button>
          <button
            onClick={onAccept}
            disabled={!checked}
            className={`px-4 py-2 rounded-md text-white ${checked ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
          >
            J’accepte
          </button>
        </div>
      </div>
    </div>
  );
}
