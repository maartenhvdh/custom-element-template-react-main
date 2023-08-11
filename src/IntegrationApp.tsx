import { FC, useCallback, useEffect, useState } from 'react';

export const IntegrationApp: FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [number1, setNumber1] = useState<number>(0);
  const [number2, setNumber2] = useState<number>(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [itemName, setItemName] = useState<string | null>(null);
  const [watchedElementValue, setWatchedElementValue] = useState<string | null>(null);
  const [selectedAssetNames, setSelectedAssetNames] = useState<ReadonlyArray<string>>([]);
  const [selectedItemNames, setSelectedItemNames] = useState<ReadonlyArray<string>>([]);
  const [elementValue, setElementValue] = useState<string | null>(null);

  const updateWatchedElementValue = useCallback((codename: string) => {
    CustomElement.getElementValue(codename, v => typeof v === 'string' && setWatchedElementValue(v));
  }, []);

  const updateCalculation = useCallback((codename1: string, codename2: string) => {
    CustomElement.getElementValue(codename1, v => typeof v === 'number' && setNumber1(v));
    CustomElement.getElementValue(codename2, v => typeof v === 'number' && setNumber2(v));
  }, []);

  useEffect(() => {
    CustomElement.init((element, context) => {
      if (!isConfig(element.config)) {
        throw new Error('Invalid configuration of the custom element. Please check the documentation.');
      }

      setConfig(element.config);
      setProjectId(context.projectId);
      setIsDisabled(element.disabled);
      setItemName(context.item.name);
      updateWatchedElementValue(element.config.textElementCodename);
      updateCalculation(element.config.fieldNumber1, element.config.fieldNumber2);
      setElementValue((number1 + number2).toString());
    });
  }, [updateWatchedElementValue, updateCalculation]);

  useEffect(() => {
    CustomElement.setHeight(500);
  }, []);

  useEffect(() => {
    CustomElement.onDisabledChanged(setIsDisabled);
  }, []);

  useEffect(() => {
    CustomElement.observeItemChanges(i => setItemName(i.name));
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }
    CustomElement.observeElementChanges([config.textElementCodename], () => updateWatchedElementValue(config.textElementCodename));
    CustomElement.observeElementChanges([config.fieldNumber1], () => updateCalculation(config.fieldNumber1, config.fieldNumber2));
    CustomElement.observeElementChanges([config.fieldNumber2], () => updateCalculation(config.fieldNumber1, config.fieldNumber2));
  }, [config, updateWatchedElementValue, updateCalculation]);

  const selectAssets = () =>
    CustomElement.selectAssets({ allowMultiple: true, fileType: 'all' })
      .then(ids => CustomElement.getAssetDetails(ids?.map(i => i.id) ?? []))
      .then(assets => setSelectedAssetNames(assets?.map(asset => asset.name) ?? []));

  const selectItems = () =>
    CustomElement.selectItems({ allowMultiple: true })
      .then(ids => CustomElement.getItemDetails(ids?.map(i => i.id) ?? []))
      .then(items => setSelectedItemNames(items?.map(item => item.name) ?? []));

  const updateValue = (newValue: string) => {
    CustomElement.setValue(newValue);
    setElementValue(newValue);
  };

  if (!config || !projectId || elementValue === null || watchedElementValue === null || itemName === null) {
    return null;
  }

  return (
    <>
      <h1>
        This is a great integration with the Kontent.ai app.
      </h1>
      <section>
        {number1} + {number2} = {elementValue}
      </section>
      <section>
        projectId: {projectId}; item name: {itemName}
      </section>
      <section>
        configuration: {JSON.stringify(config)}
      </section>
      <section>
        <input value={elementValue} onChange={e => updateValue(e.target.value)} disabled={isDisabled} />
      </section>
      <section>
        This is the watched element: {watchedElementValue}
      </section>
      <section>
        These are your selected asset names: {selectedAssetNames.join(', ')}
        <button onClick={selectAssets}>Select different assets</button>
      </section>
      <section>
        These are your selected item names: {selectedItemNames.join(', ')}
        <button onClick={selectItems}>Select different items</button>
      </section>
    </>
  );
};

IntegrationApp.displayName = 'IntegrationApp';

type Config = Readonly<{
  // expected custom element's configuration
  textElementCodename: string;
  fieldNumber1: string;
  fieldNumber2: string;
}>;

// check it is the expected configuration
const isConfig = (v: unknown): v is Config =>
  isObject(v) &&
  hasProperty(nameOf<Config>('textElementCodename'), v) &&
  typeof v.textElementCodename === 'string' && 
  hasProperty(nameOf<Config>('fieldNumber1'), v) &&
  typeof v.textElementCodename === 'string' && 
  hasProperty(nameOf<Config>('fieldNumber2'), v) &&
  typeof v.textElementCodename === 'string';

const hasProperty = <PropName extends string, Input extends {}>(propName: PropName, v: Input): v is Input & { [key in PropName]: unknown } =>
  v.hasOwnProperty(propName);

const isObject = (v: unknown): v is {} =>
  typeof v === 'object' &&
  v !== null;

const nameOf = <Obj extends Readonly<Record<string, unknown>>>(prop: keyof Obj) => prop;
